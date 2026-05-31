"""Отправка чека/квитанции на email клиенту. v2

Принимает HTML-контент чека и email получателя, отправляет красивое письмо
через Яндекс SMTP. Используется для чека ремонта и чека продажи из ломбарда.
"""
import json
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token',
}

SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
SMTP_USER = 'lekermanya@yandex.ru'
SMTP_FROM_NAME = 'Скупка24'


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def has_access(headers_in: dict) -> bool:
    token = headers_in.get('x-admin-token', '') or headers_in.get('x-employee-token', '')
    return bool(token)


def build_email_html(check_type: str, subject_data: dict, check_html: str) -> str:
    """Оборачивает HTML чека в красивый фирменный email-шаблон Скупки24."""
    title = subject_data.get('title', 'Квитанция Скупка24')
    order_id = subject_data.get('order_id', '')
    client_name = subject_data.get('client_name', '')
    greeting = f'Здравствуйте, {client_name}!' if client_name else 'Здравствуйте!'
    doc_line = f'Ваш чек по заказу <span style="color:#FFD700;font-weight:bold">#{order_id}</span>' if order_id else 'Ваш документ'
    icon = '🔧' if check_type == 'repair' else '🛍️'

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- ШАПКА -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a1a1a 0%,#111 100%);border-radius:16px 16px 0 0;padding:32px 40px;border-bottom:2px solid #FFD700">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:28px;font-weight:900;color:#FFD700;letter-spacing:2px;line-height:1">СКУПКА<span style="color:#fff">24</span></div>
            <div style="font-size:12px;color:#666;margin-top:4px;letter-spacing:1px;text-transform:uppercase">г. Калуга · Покупаем дорого</div>
          </td>
          <td align="right">
            <div style="background:#FFD700;color:#000;padding:8px 18px;border-radius:30px;font-size:13px;font-weight:800;letter-spacing:0.5px;display:inline-block">{icon} {title}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ПРИВЕТСТВИЕ -->
  <tr>
    <td style="background:#161616;padding:28px 40px 20px">
      <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px">{greeting}</div>
      <div style="font-size:14px;color:#aaa;line-height:1.7">
        {doc_line} прикреплён ниже.<br>
        Сохраните это письмо — он понадобится при обращении по гарантии.
      </div>
    </td>
  </tr>

  <!-- РАЗДЕЛИТЕЛЬ -->
  <tr>
    <td style="background:#161616;padding:0 40px">
      <div style="height:1px;background:linear-gradient(90deg,transparent,#FFD700,transparent)"></div>
    </td>
  </tr>

  <!-- ЧЕК -->
  <tr>
    <td style="background:#161616;padding:28px 40px">
      <div style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;padding:24px;color:#e0e0e0;font-size:13px;line-height:1.8">
        {check_html}
      </div>
    </td>
  </tr>

  <!-- КНОПКА НА САЙТ -->
  <tr>
    <td style="background:#161616;padding:8px 40px 28px;text-align:center">
      <a href="https://skypka24.com" style="display:inline-block;background:#FFD700;color:#000;font-weight:800;font-size:14px;padding:14px 36px;border-radius:30px;text-decoration:none;letter-spacing:0.5px">
        Перейти на сайт →
      </a>
    </td>
  </tr>

  <!-- КОНТАКТЫ -->
  <tr>
    <td style="background:#111;padding:20px 40px;border-top:1px solid #222">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#555;line-height:2">
            📍 г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
            📞 <a href="tel:+79929903333" style="color:#888;text-decoration:none">+7 (992) 990-33-33</a><br>
            🌐 <a href="https://skypka24.com" style="color:#FFD700;text-decoration:none">skypka24.com</a>
          </td>
          <td align="right" style="font-size:11px;color:#444;line-height:1.8">
            ИП Мамедов Адиль Мирза Оглы<br>
            ИНН: 402810962699<br>
            ОГРНИП: 307402814200032
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ПОДВАЛ -->
  <tr>
    <td style="background:#0a0a0a;border-radius:0 0 16px 16px;padding:16px 40px;text-align:center">
      <div style="font-size:11px;color:#444">© 2025 Скупка24 · Все права защищены</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def send_email(to_email: str, subject: str, html_body: str) -> None:
    password = os.environ.get('YANDEX_SMTP_PASSWORD', '').strip()
    sender = SMTP_USER

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((SMTP_FROM_NAME, sender))
    msg['To'] = to_email

    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=12) as server:
        server.login(sender, password)
        server.sendmail(sender, [to_email], msg.as_string())


def handler(event: dict, context) -> dict:
    """Отправка чека/квитанции на email клиента."""
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if method != 'POST':
        return err(405, 'method not allowed')

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    if not has_access(headers_in):
        return err(403, 'forbidden')

    raw = event.get('body', '') or ''
    body = json.loads(raw) if raw else {}

    to_email = (body.get('email') or '').strip()
    check_html = (body.get('check_html') or '').strip()
    check_type = body.get('check_type', 'repair')  # 'repair' | 'sale'
    order_id = body.get('order_id', '')
    client_name = (body.get('client_name') or '').strip()

    if not to_email:
        return err(400, 'email required')
    if not check_html:
        return err(400, 'check_html required')

    # Формируем тему письма
    if check_type == 'repair':
        title = 'Чек ремонта'
        subject = f'Скупка24 — Чек ремонта #{order_id}' if order_id else 'Скупка24 — Чек ремонта'
    else:
        title = 'Товарный чек'
        subject = f'Скупка24 — Товарный чек #{order_id}' if order_id else 'Скупка24 — Товарный чек'

    subject_data = {'title': title, 'order_id': order_id, 'client_name': client_name}
    email_html = build_email_html(check_type, subject_data, check_html)

    send_email(to_email, subject, email_html)

    return ok({'sent': True, 'to': to_email})