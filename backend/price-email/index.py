"""
Отправка прайса Скупки24 на почту и/или в MAX-чат (staff_send).
Берёт актуальные данные из Smartbery API (только in_stock),
применяет наценку, показывает SIM/eSIM тип.

POST /
{
  "admin_token": "Mark2015N",
  "markup": 0,             -- наценка в рублях (0 = без наценки)
  "email": "x@mail.ru",   -- куда слать (опционально)
  "send_max": true,        -- отправить в общий staff MAX-чат (опционально)
  "only_available": true   -- только в наличии (по умолч. true)
}
"""
import json, os, re, smtplib, ssl, urllib.request
import psycopg2

SCHEMA = "t_p31606708_tech_buying_service"
from datetime import datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-Employee-Token",
}

SMARTBERY_URL = "https://smartbery-qrcode.ru/api/v1/products/"
SMTP_HOST     = "smtp.yandex.ru"
SMTP_PORT     = 465
SMTP_USER     = "lekermanya@yandex.ru"
FROM_NAME     = "Скупка24"
ADMIN_TOKEN   = "Mark2015N"

# URL нашего max-bot, который умеет staff_send
MAX_BOT_URL   = "https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c"


def _ok(d):
    return {"statusCode": 200, "headers": HEADERS,
            "body": json.dumps(d, ensure_ascii=False, default=str)}

def _err(msg, code=400):
    return {"statusCode": code, "headers": HEADERS,
            "body": json.dumps({"error": msg}, ensure_ascii=False)}

def _is_admin(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}
    t = (hdrs.get("x-admin-token","") or hdrs.get("x-employee-token","")
         or body.get("admin_token",""))
    return t == ADMIN_TOKEN


# ── Smartbery ──────────────────────────────────────────────────────────────────
def fetch_products(only_available: bool) -> list:
    token = os.environ.get("SMARTBERY_TOKEN", "")
    req = urllib.request.Request(
        SMARTBERY_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())
    if only_available:
        data = [p for p in data if p.get("availability")]
    return data


# SIM данных в Smartbery API нет — поле не предусмотрено источником


# ── Фото из БД ────────────────────────────────────────────────────────────────
def load_cdn_photos() -> dict:
    """
    Загружает CDN-фото из таблицы catalog для всех smartbery-товаров.
    Ключ — нормализованное название (lowercase без пробелов), значение — cdn URL.
    """
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur  = conn.cursor()
        cur.execute(
            f"SELECT sku, photo_url FROM {SCHEMA}.catalog "
            f"WHERE sku LIKE 'smartbery_%' "
            f"AND photo_url LIKE 'https://cdn.poehali.dev/%'"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        # sku вида "smartbery_15_256_black" → убираем "smartbery_" → "15_256_black"
        return {
            row[0].replace("smartbery_", ""): row[1]
            for row in rows if row[1]
        }
    except Exception as e:
        print(f"[price-email][photos] {e}")
        return {}


def _sku_key(name: str) -> str:
    """Нормализует название в sku-ключ: '15 256 Black' → '15_256_black'"""
    return name.strip().lower().replace(" ", "_")


# ── Категория ─────────────────────────────────────────────────────────────────
CATEGORY_ORDER = [
    "iPhone", "MacBook", "iPad", "Apple Watch", "AirPods",
    "Смартфоны Samsung", "Смартфоны Xiaomi", "Смартфоны Honor",
    "Наушники", "Планшеты", "Умные часы", "Игровые консоли",
    "Аксессуары Apple", "Аксессуары", "Прочее",
]
CAT_EMOJI = {
    "iPhone": "📱", "MacBook": "💻", "iPad": "🖥️",
    "Apple Watch": "⌚", "AirPods": "🎧",
    "Смартфоны Samsung": "📲", "Смартфоны Xiaomi": "📲", "Смартфоны Honor": "📲",
    "Наушники": "🎧", "Планшеты": "📋", "Умные часы": "⌚",
    "Игровые консоли": "🎮", "Аксессуары Apple": "🔌",
    "Аксессуары": "🔌", "Прочее": "📦",
}
CAT_MAP = {
    "Redmi": "Смартфоны Xiaomi", "Poco": "Смартфоны Xiaomi", "Xiaomi": "Смартфоны Xiaomi",
    "Samsung": "Смартфоны Samsung", "Galaxy": "Смартфоны Samsung",
    "Honor": "Смартфоны Honor",
    "iPad": "Планшеты", "MacBook": "MacBook",
    "AirPods": "AirPods", "Earpods": "Наушники", "EarPods": "Наушники",
    "Watch": "Apple Watch", "Pencil": "Аксессуары Apple",
    "PS5": "Игровые консоли", "JBL": "Наушники", "Tab": "Планшеты",
    "Кабель": "Аксессуары", "Стекло": "Аксессуары", "Чехол": "Аксессуары",
    "SE2": "iPhone", "SE3": "iPhone", "16e": "iPhone",
    "17e": "iPhone", "Air": "iPhone",
}

def detect_category(name: str) -> str:
    first = name.strip().split()[0] if name.strip() else ""
    if first in CAT_MAP:
        return CAT_MAP[first]
    if first.isdigit() and len(first) <= 2:
        return "iPhone"
    return "Прочее"


# ── Группировка ────────────────────────────────────────────────────────────────
def group_products(products: list, markup: int, cdn_photos: dict | None = None) -> dict:
    groups: dict = {}
    cdn_photos = cdn_photos or {}
    for p in products:
        raw_name  = (p.get("name") or "").strip()
        raw_price = p.get("price")
        region    = p.get("country") or ""
        category  = detect_category(raw_name)
        # Ищем CDN-фото по ключу
        photo = cdn_photos.get(_sku_key(raw_name))

        price_str = "—"
        if raw_price is not None:
            final = int(raw_price) + markup
            price_str = f"{final:,}".replace(",", " ") + " ₽"

        groups.setdefault(category, []).append({
            "name": raw_name,
            "price": price_str,
            "has_price": raw_price is not None,
            "region": region,
            "photo": photo,
        })

    ordered = {}
    for cat in CATEGORY_ORDER:
        if cat in groups:
            ordered[cat] = groups[cat]
    for cat in groups:
        if cat not in ordered:
            ordered[cat] = groups[cat]
    return ordered


# ── HTML прайс ─────────────────────────────────────────────────────────────────
def build_price_html(groups: dict, markup: int, generated_at: str, only_available: bool) -> str:
    markup_note = f"наценка +{markup:,} ₽".replace(",", " ") if markup > 0 else "цены без наценки"
    avail_note  = "только в наличии" if only_available else "включая под заказ"
    total       = sum(len(v) for v in groups.values())

    sections_html = ""
    for cat, items in groups.items():
        emoji = CAT_EMOJI.get(cat, "📦")
        rows = ""
        for i, item in enumerate(items):
            bg = "#1a1a1a" if i % 2 == 0 else "#161616"
            # Регион
            region_badge = ""
            if item["region"]:
                rc = {"EU": "#4ade80", "US": "#60a5fa"}.get(item["region"], "#fbbf24")
                region_badge = (f'<span style="font-size:9px;background:{rc}22;color:{rc};'
                                f'border:1px solid {rc}44;border-radius:4px;padding:1px 5px;'
                                f'margin-left:5px;vertical-align:middle">{item["region"]}</span>')
            price_color = "#FFD700" if item["has_price"] else "#555"
            # Фото — маленькое превью слева
            photo_cell = ""
            if item.get("photo"):
                photo_cell = (
                    f'<td style="width:52px;padding:4px 0 4px 10px;background:{bg};border-bottom:1px solid #222;vertical-align:middle">'
                    f'<img src="{item["photo"]}" width="44" height="44" '
                    f'style="border-radius:6px;object-fit:cover;display:block" alt="">'
                    f'</td>'
                )
                name_td_style = f"padding:7px 8px 7px 8px;background:{bg};border-bottom:1px solid #222;font-size:13px;color:#ddd"
            else:
                photo_cell = f'<td style="width:0;padding:0;background:{bg};border-bottom:1px solid #222"></td>'
                name_td_style = f"padding:7px 12px;background:{bg};border-bottom:1px solid #222;font-size:13px;color:#ddd"

            rows += f"""
            <tr>
              {photo_cell}
              <td style="{name_td_style}">
                {item["name"]}{region_badge}
              </td>
              <td style="padding:7px 16px;background:{bg};border-bottom:1px solid #222;
                         text-align:right;font-size:13px;font-weight:700;
                         color:{price_color};white-space:nowrap">
                {item["price"]}
              </td>
            </tr>"""

        sections_html += f"""
        <tr>
          <td colspan="2" style="padding:16px 12px 6px;background:#0f0f0f">
            <div style="font-size:14px;font-weight:800;color:#FFD700;
                        letter-spacing:1px;text-transform:uppercase">
              {emoji} {cat}
              <span style="font-size:11px;color:#555;font-weight:400;text-transform:none">
                ({len(items)} шт.)
              </span>
            </div>
          </td>
        </tr>
        {rows}"""

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Прайс Скупка24</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#0d0d0d;padding:24px 8px">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0"
       style="max-width:640px;width:100%">

  <tr>
    <td style="background:linear-gradient(135deg,#1a1a1a,#111);
               border-radius:16px 16px 0 0;padding:28px 32px;
               border-bottom:2px solid #FFD700">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <div style="font-size:26px;font-weight:900;color:#FFD700;
                      letter-spacing:2px">СКУПКА<span style="color:#fff">24</span></div>
          <div style="font-size:11px;color:#666;margin-top:3px;
                      text-transform:uppercase;letter-spacing:1px">
            г. Калуга · Покупаем дорого
          </div>
        </td>
        <td align="right">
          <div style="background:#FFD700;color:#000;padding:8px 18px;
                      border-radius:30px;font-size:13px;font-weight:800">
            🏷️ Прайс-лист
          </div>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr>
    <td style="background:#161616;padding:14px 32px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:12px;color:#888">
          📅 {generated_at} · {avail_note} · {total} позиций
        </td>
        <td align="right" style="font-size:12px;color:#aaa">{markup_note}</td>
      </tr></table>
    </td>
  </tr>

  <tr><td style="background:#161616;padding:0 32px">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#FFD700,transparent)"></div>
  </td></tr>

  <tr>
    <td style="background:#0f0f0f;padding:8px 0">
      <table width="100%" cellpadding="0" cellspacing="0">
        {sections_html}
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:#161616;padding:20px 32px;text-align:center">
      <a href="https://skypka24.com/catalog"
         style="display:inline-block;background:#FFD700;color:#000;
                font-weight:800;font-size:14px;padding:12px 32px;
                border-radius:30px;text-decoration:none">
        Смотреть каталог →
      </a>
    </td>
  </tr>

  <tr>
    <td style="background:#111;padding:16px 32px;border-top:1px solid #1e1e1e">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:11px;color:#555;line-height:2">
          📍 г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
          📞 <a href="tel:+79929903333"
                style="color:#777;text-decoration:none">+7 (992) 990-33-33</a>
          &nbsp;·&nbsp;
          🌐 <a href="https://skypka24.com"
                style="color:#FFD700;text-decoration:none">skypka24.com</a>
        </td>
        <td align="right" style="font-size:11px;color:#444;line-height:1.9">
          ИП Мамедов Адиль Мирза Оглы<br>ИНН: 402810962699
        </td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#0a0a0a;border-radius:0 0 16px 16px;
               padding:12px 32px;text-align:center">
      <div style="font-size:10px;color:#333">© 2025 Скупка24</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


MAX_MSG_LIMIT = 3800  # символов на одно сообщение MAX

# ── MAX сообщения (разбитые на части) ────────────────────────────────────────
def build_max_parts(groups: dict, markup: int, total: int, generated_at: str) -> list:
    """Возвращает список строк — каждая ≤ MAX_MSG_LIMIT символов."""
    markup_note = f"наценка +{markup:,} ₽".replace(",", " ") if markup > 0 else "без наценки"
    header = f"🏷️ *Прайс Скупка24* — {generated_at}\n_{markup_note} · {total} позиций_"

    parts = []
    current = header + "\n"

    for cat, items in groups.items():
        emoji = CAT_EMOJI.get(cat, "📦")
        cat_lines = [f"\n*{emoji} {cat}*"]
        for item in items:
            region = f" [{item['region']}]" if item["region"] else ""
            cat_lines.append(f"• {item['name']}{region} — {item['price']}")

        block = "\n".join(cat_lines)

        # Если блок не влезает — закрываем текущую часть, открываем новую
        if len(current) + len(block) > MAX_MSG_LIMIT:
            parts.append(current.strip())
            current = block + "\n"
        else:
            current += block + "\n"

    if current.strip():
        parts.append(current.strip())

    # Добавляем контакты в последнюю часть
    footer = "\n\n📞 +7 (992) 990-33-33 | skypka24.com"
    if parts:
        if len(parts[-1]) + len(footer) <= MAX_MSG_LIMIT:
            parts[-1] += footer
        else:
            parts.append(footer.strip())

    return parts


def send_max_staff_part(text: str):
    """Отправляет одну часть в общий staff-чат через max-bot?action=staff_send."""
    payload = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        f"{MAX_BOT_URL}?action=staff_send",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def send_max_staff(groups: dict, markup: int, total: int, generated_at: str):
    """Разбивает прайс на части и отправляет каждую отдельным сообщением."""
    parts = build_max_parts(groups, markup, total, generated_at)
    for part in parts:
        send_max_staff_part(part)


# ── Email ──────────────────────────────────────────────────────────────────────
def send_email(to_email: str, html_body: str, markup: int):
    password = os.environ.get("YANDEX_SMTP_PASSWORD", "").strip()
    msk_now  = datetime.now(timezone(timedelta(hours=3)))
    markup_sfx = f" (+{markup:,} ₽)".replace(",", " ") if markup > 0 else ""
    subject  = f"Скупка24 — Прайс-лист {msk_now.strftime('%d.%m.%Y')}{markup_sfx}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = formataddr((FROM_NAME, SMTP_USER))
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=15) as s:
        s.login(SMTP_USER, password)
        s.sendmail(SMTP_USER, [to_email], msg.as_string())


# ── Handler ────────────────────────────────────────────────────────────────────
def handler(event: dict, context) -> dict:
    """Отправка актуального прайса Smartbery на почту и/или в MAX staff-чат."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    if not _is_admin(event):
        return _err("Forbidden", 403)

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    markup         = int(body.get("markup", 0))
    email          = (body.get("email") or "").strip()
    send_max_flag  = bool(body.get("send_max", False))
    only_available = bool(body.get("only_available", True))

    if not email and not send_max_flag:
        return _err("Укажите email или send_max=true")

    # 1. Товары
    products = fetch_products(only_available)
    total    = len(products)
    if not products:
        return _err("Smartbery вернул пустой список")

    # 2. Фото из S3 (только для email — MAX текстовый)
    cdn_photos: dict = {}
    if email:
        cdn_photos = load_cdn_photos()

    # 3. Группировка
    groups  = group_products(products, markup, cdn_photos)
    msk_now = datetime.now(timezone(timedelta(hours=3)))
    gen_at  = msk_now.strftime("%d.%m.%Y %H:%M МСК")

    results: dict = {"total": total, "markup": markup, "photos": len(cdn_photos)}

    # 4. Email
    if email:
        html = build_price_html(groups, markup, gen_at, only_available)
        send_email(email, html, markup)
        results["email_sent"] = True
        results["email_to"]   = email

    # 4. MAX staff_send (разбивается на части автоматически)
    if send_max_flag:
        send_max_staff(groups, markup, total, gen_at)
        results["max_sent"] = True

    return _ok({"ok": True, **results})