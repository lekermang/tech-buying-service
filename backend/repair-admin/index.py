import json
import os
import psycopg2
import requests

HEADERS = {'Access-Control-Allow-Origin': '*'}


STATUS_LABELS = {
    'new': '🆕 Новая',
    'in_progress': '🔧 В работе',
    'waiting_parts': '⏳ Ожидание запчастей',
    'ready': '✅ Готово к выдаче',
    'done': '✔️ Выдано',
    'cancelled': '❌ Отменено',
}


def send_tg_all(token: str, main_chat_id: str, conn, message: str):
    """Отправить уведомление в основной чат и всем активным получателям из БД"""
    tg_url = f'https://api.telegram.org/bot{token}'
    recipients = [main_chat_id]
    try:
        cur2 = conn.cursor()
        cur2.execute(
            f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active = true AND notify_repair = true"
        )
        rows = cur2.fetchall()
        cur2.close()
        for row in rows:
            cid = row[0]
            if cid and cid not in recipients:
                recipients.append(cid)
    except Exception:
        pass
    pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    if pluxan and pluxan not in recipients:
        recipients.append(pluxan)
    for cid in recipients:
        try:
            requests.post(
                f'{tg_url}/sendMessage',
                json={'chat_id': cid, 'text': message, 'parse_mode': 'Markdown'},
                timeout=10
            )
        except Exception:
            pass


def build_act_html(order_id, name, phone, model, repair_type, price_str, comment, advance=0, is_paid=False) -> bytes:
    import datetime
    now = datetime.datetime.now()
    date_str = now.strftime('%d.%m.%Y')
    order_num = str(order_id).zfill(6)
    advance_val = int(advance) if advance else 0
    paid_str = 'Оплачено полностью ✓' if is_paid else (f'Аванс: {advance_val:,} ₽'.replace(',', ' ') if advance_val > 0 else '0')

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Акт приёма №{order_id}</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Arial,sans-serif;font-size:10px;color:#000;background:#fff}}
.page{{width:210mm;margin:0 auto;padding:7mm 9mm}}
@media print{{body{{margin:0}}.page{{padding:7mm 9mm;width:100%}}}}
.page-break{{page-break-before:always;padding-top:5mm}}
.page-num{{font-size:8px;color:#777;text-align:right;margin-bottom:1px}}
.hdr{{display:flex;align-items:stretch;margin-bottom:5px;border:1px solid #000}}
.hdr-mid{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 10px;border-right:1px solid #000;text-align:center}}
.hdr-mid .t1{{font-size:14px;font-weight:bold}}.hdr-mid .t2{{font-size:9px;color:#555;margin:1px 0 4px}}
.hdr-mid .t3{{font-size:12px;font-weight:bold}}.hdr-mid .t4{{font-size:9px;color:#333;margin-top:1px}}
.hdr-right{{padding:5px 8px;font-size:8.5px;line-height:1.7;min-width:175px;display:flex;flex-direction:column;justify-content:center}}
.hdr-right b{{font-size:9.5px;display:block;margin-bottom:1px}}
.sec3{{display:flex;border:1px solid #000;margin-bottom:5px}}
.sc{{flex:1;border-right:1px solid #ccc}}.sc:last-child{{border-right:none}}
.sc-h{{background:#efefef;padding:2px 6px;font-weight:bold;font-size:9px;border-bottom:1px solid #ccc}}
.sc-b{{padding:4px 6px}}.f{{margin-bottom:2px}}.fl{{font-size:8px;color:#555}}.fv{{font-weight:bold;font-size:10px}}.fvn{{font-size:10px}}
.notes{{margin-bottom:5px;border-bottom:1px solid #000;padding-bottom:3px}}
.notes-lbl{{font-size:8.5px;font-weight:bold;margin-bottom:14px}}
.dmg-wrap{{display:flex;border:1px solid #000;margin-bottom:5px}}
.dmg-left{{flex:1.2;border-right:1px solid #ccc;padding:5px 6px;display:flex;flex-direction:column;gap:6px}}
.dmg-title{{font-size:9px;font-weight:bold;margin-bottom:1px}}
.dmg-hint{{font-size:7.5px;color:#555;margin-bottom:3px}}
.dmg-right{{flex:1;padding:4px 5px}}
.phone-row{{display:flex;align-items:stretch;justify-content:space-between;gap:0}}
.phone-view{{display:flex;flex-direction:column;align-items:center;flex:1}}
.phone-view svg{{width:100%;height:auto;display:block}}
.laptop-row{{display:flex;align-items:stretch;justify-content:space-between;gap:0}}
.laptop-view{{display:flex;flex-direction:column;align-items:center;flex:3}}
.laptop-view svg{{width:100%;height:auto;display:block}}
.laptop-view-narrow{{display:flex;flex-direction:column;align-items:center;flex:1}}
.laptop-view-narrow svg{{width:100%;height:auto;display:block}}
.ctbl{{width:100%;border-collapse:collapse;font-size:8.5px}}
.ctbl th{{background:#efefef;border:1px solid #bbb;padding:2px 4px;text-align:left}}
.ctbl td{{border:1px solid #bbb;padding:2px 4px}}
.ctbl td:last-child{{width:80px;min-height:14px}}
.cond-wrap{{display:flex;border:1px solid #000;margin-bottom:5px}}
.cond-left{{flex:1;padding:4px 8px 4px 6px;border-right:1px solid #ccc}}
.cond-right{{width:130px;padding:5px 7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center}}
.cond-title{{font-size:8.5px;font-weight:bold;background:#efefef;padding:2px 6px;border-bottom:1px solid #ccc;margin:-4px -8px 4px -6px}}
.cond-ol{{padding-left:16px;font-size:7.8px;line-height:1.6;margin:0}}
.cond-ol li{{margin-bottom:1px}}
.cond-agree{{font-size:8px;font-weight:bold;line-height:1.4;border:1px solid #000;padding:4px;text-align:center}}
.cond-link{{font-size:9px;font-weight:bold;color:#000}}
.signs{{display:flex;border:1px solid #000}}
.sign-col{{flex:1;padding:6px 10px}}.sign-col:first-child{{border-right:1px solid #000}}
.sign-title{{font-size:8.5px;margin-bottom:2px}}.sign-who{{font-size:9px;margin-bottom:10px}}
.sign-line-row{{display:flex;gap:16px;margin-bottom:2px}}
.sign-blank{{flex:1;border-bottom:1px solid #000;height:14px}}
.sign-hint{{display:flex;gap:16px;font-size:7.5px;color:#777}}
.sign-hint span{{flex:1;text-align:center}}
.print-btn{{text-align:center;padding:10px;background:#f5f5f5;border-bottom:1px solid #ccc}}
@media print{{.print-btn{{display:none}}}}
</style>
</head><body>
<div class="print-btn">
  <button onclick="window.print()" style="padding:8px 28px;font-size:14px;cursor:pointer;background:#FFD700;border:2px solid #000;font-weight:bold">🖨 Распечатать акт</button>
</div>
<div class="page">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
  <span style="font-size:8px;color:#555">Экз. Клиента</span>
  <span style="font-size:8px;color:#777">Стр. 1 из 2</span>
</div>

<div class="hdr">
  <div class="hdr-mid">
    <div class="t1">Акт приёма — передачи</div>
    <div class="t2">устройства в ремонт</div>
    <div class="t3">№ {order_num}</div>
    <div class="t4">от {date_str}</div>
  </div>
  <div class="hdr-right">
    <b>Исполнитель:</b>
    ИП Мамедов Адиль Мирза Оглы<br>
    ИНН: 402810962699<br>
    ОГРНИП: 307402814200032<br>
    г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
    Тел.: +7 (992) 990-33-33<br>
    skypka24.com
  </div>
  <div style="padding:4px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:1px solid #000;min-width:70px">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://skypka24.com/act" width="60" height="60" alt="QR" style="display:block"/>
    <div style="font-size:6.5px;color:#555;text-align:center;margin-top:2px">skypka24.com/act</div>
  </div>
</div>

<div class="sec3">
  <div class="sc">
    <div class="sc-h">Клиент:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">ФИО Клиента:</div><div class="fv">{name}</div></div>
      <div style="height:8px"></div>
      <div class="f"><div class="fl">Телефон Клиента:</div><div class="fv">{phone}</div></div>
    </div>
  </div>
  <div class="sc">
    <div class="sc-h">Устройство:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">Устройство:</div><div class="fv">{model or '—'}</div></div>
      <div class="f"><div class="fl">Цвет:</div><div class="fvn">—</div></div>
      <div class="f"><div class="fl">Пароль от устройства:</div><div class="fvn">&nbsp;</div></div>
      <div class="f"><div class="fl">Сер. №:</div><div class="fvn">—</div></div>
      <div class="f"><div class="fl">IMEI:</div><div class="fvn">&nbsp;</div></div>
    </div>
  </div>
  <div class="sc">
    <div class="sc-h">Ремонт:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">Ориентировочная стоимость:</div><div class="fvn">{price_str}</div></div>
      <div class="f"><div class="fl">Аванс / Оплата:</div><div class="fvn" style="{'font-weight:bold;color:#2a7a2a' if is_paid else ''}">{paid_str}</div></div>
      <div style="height:4px"></div>
      <div class="f"><div class="fl">Срок ремонта:</div><div class="fvn">По договорённости</div></div>
      <div class="f"><div class="fl">Заявленные неисправности:</div><div class="fvn">{comment or repair_type or '—'}</div></div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="notes-lbl">Заметки приёмщика:</div>
</div>

<div class="dmg-wrap">
  <div class="dmg-left">
    <div>
      <div class="dmg-title">Наружные повреждения</div>
      <div class="dmg-hint">Отметить на схеме: * – скол, / – вмятина, v – царапина</div>
    </div>
    <div class="phone-row">
      <div class="phone-view">
        <svg viewBox="0 0 60 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="56" height="112" rx="8" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="7" y="13" width="46" height="90" fill="none" stroke="#000" stroke-width="1.1"/>
          <ellipse cx="30" cy="8" rx="8" ry="2.5" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="30" cy="107" r="4.5" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Спереди</div>
      </div>
      <div class="phone-view">
        <svg viewBox="0 0 60 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="56" height="112" rx="8" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="6" y="7" width="22" height="22" rx="5" fill="none" stroke="#000" stroke-width="1.3"/>
          <circle cx="17" cy="18" r="7" fill="none" stroke="#000" stroke-width="1.1"/>
          <circle cx="32" cy="10" r="3.5" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="7" y="32" width="12" height="2.5" rx="1.2" fill="#ccc" stroke="none"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Сзади</div>
      </div>
      <div class="phone-view" style="flex:0.38">
        <svg viewBox="0 0 22 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="18" height="112" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="0" y="24" width="4" height="18" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="0" y="46" width="4" height="18" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="18" y="34" width="4" height="24" rx="2" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Слева</div>
      </div>
      <div class="phone-view" style="flex:1.1;justify-content:flex-end">
        <svg viewBox="0 0 116 22" xmlns="http://www.w3.org/2000/svg" style="margin-top:auto">
          <rect x="2" y="2" width="112" height="18" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="38" y="4" width="40" height="14" rx="3.5" fill="none" stroke="#000" stroke-width="1.1"/>
          <rect x="8" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="17" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="98" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center;margin-top:2px">Снизу</div>
      </div>
    </div>
    <div>
      <div style="font-size:8px;color:#555;margin-bottom:2px;font-weight:bold">Ноутбук / Планшет:</div>
      <div class="laptop-row">
        <div class="laptop-view">
          <svg viewBox="0 0 130 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="126" height="78" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="8" y="8" width="114" height="66" fill="none" stroke="#000" stroke-width="1.1"/>
            <circle cx="65" cy="5" r="2.2" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="0" y="82" width="130" height="12" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="44" y="84" width="42" height="8" rx="2.5" fill="none" stroke="#000" stroke-width="1"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Спереди</div>
        </div>
        <div class="laptop-view">
          <svg viewBox="0 0 130 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="126" height="12" rx="4" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="0" y="16" width="130" height="78" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Сзади</div>
        </div>
        <div class="laptop-view-narrow">
          <svg viewBox="0 0 32 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="2" width="12" height="66" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="2" y="70" width="28" height="12" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="4" y="72" width="10" height="8" rx="1.5" fill="none" stroke="#000" stroke-width="1"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Сбоку</div>
        </div>
      </div>
    </div>
  </div>
  <div class="dmg-right">
    <table class="ctbl">
      <thead><tr><th>Проверка функций</th><th>До ремонта</th></tr></thead>
      <tbody>
        <tr><td>Кнопка Home</td><td>&nbsp;</td></tr>
        <tr><td>Кнопка Вкл./Выкл.</td><td>&nbsp;</td></tr>
        <tr><td>Изменение геометрии</td><td>&nbsp;</td></tr>
        <tr><td>Деформация корпуса</td><td>&nbsp;</td></tr>
        <tr><td>Компас и гироскоп</td><td>&nbsp;</td></tr>
        <tr><td>Кнопки громкости (меню)</td><td>&nbsp;</td></tr>
        <tr><td>Поиск сети</td><td>&nbsp;</td></tr>
        <tr><td>Нижний микрофон (диктофон)</td><td>&nbsp;</td></tr>
        <tr><td>Полифонический динамик</td><td>&nbsp;</td></tr>
        <tr><td>Wi-Fi/Bluetooth</td><td>&nbsp;</td></tr>
        <tr><td>Фонарик</td><td>&nbsp;</td></tr>
        <tr><td>Датчик приближения</td><td>&nbsp;</td></tr>
        <tr><td>Кнопки громкости (вызов)</td><td>&nbsp;</td></tr>
        <tr><td>Камера основная</td><td>&nbsp;</td></tr>
        <tr><td>Чтение SIM-карты</td><td>&nbsp;</td></tr>
        <tr><td>Датчик освещённости</td><td>&nbsp;</td></tr>
        <tr><td>Дисплей (touch/стекло/полосы)</td><td>&nbsp;</td></tr>
        <tr><td>Сканер радужки глаз</td><td>&nbsp;</td></tr>
        <tr><td>Touch ID / Face ID</td><td>&nbsp;</td></tr>
        <tr><td>Беспроводная зарядка</td><td>&nbsp;</td></tr>
        <tr><td>Слуховой динамик</td><td>&nbsp;</td></tr>
        <tr><td>Разъём зарядки</td><td>&nbsp;</td></tr>
        <tr><td>Переключатель вибро</td><td>&nbsp;</td></tr>
        <tr><td>Камера фронтальная</td><td>&nbsp;</td></tr>
        <tr><td>Аудиоразъём (L/R)</td><td>&nbsp;</td></tr>
      </tbody>
    </table>
  </div>
</div>

</div>

<div class="page page-break">
<div class="page-num">Стр. 2 из 2</div>

<div class="cond-wrap">
  <div class="cond-left">
    <div class="cond-title">Правила и условия проведения ремонтных работ</div>
    <ol class="cond-ol">
      <li>Правила и условия изложены на сайте <b>skypka24.com/act</b></li>
      <li>Устройство принимается без разборки и проверки внутренних неисправностей.</li>
      <li>Клиент согласен, что гарантия от производителя после ремонта невозможна.</li>
      <li>Клиент принимает риск скрытых дефектов (коррозия, влага, механика), которые нельзя проверить при приёмке.</li>
      <li>Ремонт осуществляется согласно ГОСТ Р МЭК 60065-2002, 60950-2002, 50936-2013, 57137-2016 и ФЗ «О защите прав потребителей».</li>
      <li>Установленные узлы и материалы возврату не подлежат.</li>
      <li>Исполнитель не несёт ответственности за гарантийные пломбы сторонних сервисов.</li>
      <li>Исполнитель не несёт ответственности за потерю данных при замене компонентов.</li>
      <li>Факт возврата фиксируется в форме ВО-13 в двух экземплярах.</li>
      <li>Клиент согласен, что при ремонте могут быть заменены компоненты, влияющие на IMEI.</li>
      <li><b>После воды:</b> риск выхода из строя шлейфов, динамиков, камер, платы — исполнитель ответственности не несёт.</li>
      <li><b>Неоригинальные комплектующие:</b> риск выхода из строя дисплея, антенн, платы — исполнитель ответственности не несёт.</li>
      <li>Клиент согласен, что исполнитель не несёт ответственности за неработоспособность из-за невозможности проверки всех функций.</li>
    </ol>
  </div>
  <div class="cond-right">
    <div class="cond-agree">КЛИЕНТ ОЗНАКОМЛЕН И СОГЛАСЕН С УСЛОВИЯМИ РЕМОНТА</div>
    <div class="cond-link">skypka24.com/act</div>
  </div>
</div>

<div class="signs">
  <div class="sign-col">
    <div class="sign-title">Клиент:</div>
    <div class="sign-who">С условиями ознакомлен и согласен, устройство передал:</div>
    <div style="font-size:8px;margin-bottom:4px">___________ 20___ г.</div>
    <div class="sign-line-row"><div class="sign-blank"></div><div class="sign-blank"></div></div>
    <div class="sign-hint"><span>(подпись)</span><span>(Фамилия, Имя, Отчество)</span></div>
  </div>
  <div class="sign-col">
    <div class="sign-title">Исполнитель:</div>
    <div class="sign-who">Устройство в указанном состоянии принял, работоспособность подтвердил:</div>
    <div style="font-size:8px;margin-bottom:4px">___________ 20___ г.</div>
    <div class="sign-line-row"><div class="sign-blank"></div><div class="sign-blank"></div></div>
    <div class="sign-hint"><span>(подпись)</span><span>(Фамилия, Имя, Отчество)</span></div>
  </div>
</div>

<div style="font-size:8px;text-align:center;color:#555;margin-top:6px">
  ИНН: 402810962699 · ОГРНИП: 307402814200032 · Р/с: 40802810422270001866 · КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК · БИК: 042908612
</div>

</div>
</body></html>"""

    return html.encode('utf-8')


def send_tg_document(token: str, chat_id, doc_bytes: bytes, filename: str, caption: str = '', mime: str = 'text/html'):
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendDocument',
            data={'chat_id': chat_id, 'caption': caption},
            files={'document': (filename, doc_bytes, mime)},
            timeout=30,
        )
    except Exception:
        pass


def send_sms(phone: str, message: str):
    """Отправить SMS через sms.ru"""
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return
    clean_phone = ''.join(c for c in phone if c.isdigit() or c == '+')
    try:
        requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': clean_phone, 'msg': message, 'json': 1, 'from': 'IPMamedov'},
            timeout=10
        )
    except Exception:
        pass
SCHEMA = 't_p31606708_tech_buying_service'
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'Mark2015N')
ADMIN_TOKEN_ALT = 'Mark2015N'

VALID_STATUSES = ['new', 'in_progress', 'waiting_parts', 'ready', 'done', 'cancelled']
ALLOW_HEADERS = 'Content-Type, X-Admin-Token, X-Employee-Token'


def auth(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers.get('x-admin-token', '')
    if admin_token and (admin_token == ADMIN_TOKEN or admin_token == ADMIN_TOKEN_ALT):
        return True
    emp_token = headers.get('x-employee-token', '')
    if emp_token:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token='{emp_token}' AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return row is not None
    return False


def is_owner(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers.get('x-admin-token', '')
    if admin_token and (admin_token == ADMIN_TOKEN or admin_token == ADMIN_TOKEN_ALT):
        return True
    emp_token = headers.get('x-employee-token', '')
    if emp_token:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT role FROM {SCHEMA}.employees WHERE auth_token='{emp_token}' AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return row is not None and row[0] == 'owner'
    return False


def handler(event: dict, context) -> dict:
    """Управление заявками на ремонт: список, создание, смена статуса, аналитика по периодам, доход мастера"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': ALLOW_HEADERS},
            'body': '',
        }

    # Публичные actions (без токена)
    raw_body_pub = event.get('body') or '{}'
    body_pub = json.loads(raw_body_pub) if isinstance(raw_body_pub, str) else (raw_body_pub or {})
    if event.get('httpMethod') == 'POST' and body_pub.get('action') == 'client_register':
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        full_name = str(body_pub.get('full_name', '')).strip().replace("'", "''")
        phone = ''.join(c for c in str(body_pub.get('phone', '')) if c.isdigit())
        birth_date = str(body_pub.get('birth_date', '')).strip()
        ref_phone = ''.join(c for c in str(body_pub.get('referrer_phone', '')) if c.isdigit())
        if not full_name or len(phone) < 10:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'ФИО и телефон обязательны'}, ensure_ascii=False)}
        referrer_id = 'NULL'
        if ref_phone and len(ref_phone) >= 10:
            ref_suffix = ref_phone[-10:]
            cur.execute(f"SELECT id FROM {SCHEMA}.repair_clients WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)='{ref_suffix}'")
            ref_row = cur.fetchone()
            if ref_row:
                referrer_id = str(ref_row[0])
                cur.execute(f"UPDATE {SCHEMA}.repair_clients SET discount_pct=GREATEST(discount_pct, 5) WHERE id={ref_row[0]}")
        bd_val = f"'{birth_date}'" if birth_date else 'NULL'
        cur.execute(f"""
            INSERT INTO {SCHEMA}.repair_clients (full_name, phone, birth_date, referrer_id, discount_pct)
            VALUES ('{full_name}', '+{phone}', {bd_val}, {referrer_id}, 3)
            ON CONFLICT (phone) DO UPDATE SET full_name=EXCLUDED.full_name, birth_date=EXCLUDED.birth_date
            RETURNING id, discount_pct
        """)
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'client_id': row[0], 'discount_pct': row[1]}, ensure_ascii=False)}

    # Публичный GET: theme_get — без авторизации
    if event.get('httpMethod') == 'GET':
        pub_params = event.get('queryStringParameters') or {}
        if pub_params.get('action') == 'theme_get':
            conn_pub = psycopg2.connect(os.environ['DATABASE_URL'])
            cur_pub = conn_pub.cursor()
            cur_pub.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key = 'site_theme'")
            row_pub = cur_pub.fetchone()
            cur_pub.close(); conn_pub.close()
            theme_data = None
            if row_pub and row_pub[0]:
                try:
                    theme_data = json.loads(row_pub[0])
                except Exception:
                    theme_data = None
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'theme': theme_data}, ensure_ascii=False)}

    if not auth(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        action = params.get('action', '')

        # Аналитика за период (day/week/month)
        if action == 'analytics':
            period = params.get('period', 'month')
            if period == 'day':
                interval = "1 day"
            elif period == 'week':
                interval = "7 days"
            else:
                interval = "30 days"

            # Общие показатели: новые/активные — по created_at, выдано — по status_updated_at
            cur.execute(f"""
                SELECT
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '{interval}') as total,
                    COUNT(*) FILTER (WHERE status = 'done'
                        AND COALESCE(status_updated_at, updated_at, created_at) >= NOW() - INTERVAL '{interval}') as done,
                    COUNT(*) FILTER (WHERE status = 'cancelled'
                        AND created_at >= NOW() - INTERVAL '{interval}') as cancelled,
                    COUNT(*) FILTER (WHERE status = 'ready'
                        AND created_at >= NOW() - INTERVAL '{interval}') as ready,
                    COUNT(*) FILTER (WHERE status = 'in_progress'
                        AND created_at >= NOW() - INTERVAL '{interval}') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'waiting_parts'
                        AND created_at >= NOW() - INTERVAL '{interval}') as waiting_parts,
                    COUNT(*) FILTER (WHERE status = 'new'
                        AND created_at >= NOW() - INTERVAL '{interval}') as new_count,
                    COALESCE(SUM(repair_amount) FILTER (WHERE status = 'done'
                        AND COALESCE(status_updated_at, updated_at, created_at) >= NOW() - INTERVAL '{interval}'), 0) as revenue,
                    COALESCE(SUM(purchase_amount) FILTER (WHERE status = 'done'
                        AND COALESCE(status_updated_at, updated_at, created_at) >= NOW() - INTERVAL '{interval}'), 0) as costs,
                    COALESCE(SUM(master_income) FILTER (WHERE status = 'done'
                        AND COALESCE(status_updated_at, updated_at, created_at) >= NOW() - INTERVAL '{interval}'), 0) as master_total
                FROM {SCHEMA}.repair_orders
            """)
            row = cur.fetchone()

            revenue = int(row[7]) if row[7] else 0
            costs = int(row[8]) if row[8] else 0
            master_total = int(row[9]) if row[9] else 0
            profit = revenue - costs

            # Динамика по дням — выдано считается по дате выдачи (status_updated_at)
            cur.execute(f"""
                SELECT
                    DATE((COALESCE(status_updated_at, created_at)) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') as day,
                    COUNT(*) FILTER (WHERE status = 'done') as done,
                    COALESCE(SUM(repair_amount) FILTER (WHERE status = 'done'), 0) as revenue,
                    COALESCE(SUM(purchase_amount) FILTER (WHERE status = 'done'), 0) as costs
                FROM {SCHEMA}.repair_orders
                WHERE status = 'done'
                  AND COALESCE(status_updated_at, created_at) >= NOW() - INTERVAL '{interval}'
                GROUP BY day
                ORDER BY day ASC
            """)
            daily_rows = cur.fetchall()
            daily = [
                {
                    'day': str(r[0]),
                    'total': r[1],
                    'done': r[1],
                    'revenue': int(r[2]),
                    'costs': int(r[3]),
                    'profit': int(r[2]) - int(r[3]),
                }
                for r in daily_rows
            ]

            cur.close(); conn.close()
            return {
                'statusCode': 200,
                'headers': HEADERS,
                'body': json.dumps({
                    'period': period,
                    'total': row[0], 'done': row[1], 'cancelled': row[2],
                    'ready': row[3], 'in_progress': row[4], 'waiting_parts': row[5], 'new': row[6],
                    'revenue': revenue, 'costs': costs, 'profit': profit, 'master_total': master_total,
                    'daily': daily,
                }, ensure_ascii=False)
            }

        # Дневная статистика (30 дней)
        if action == 'daily_stats':
            cur.execute(f"""
                SELECT
                    DATE(created_at + INTERVAL '3 hours') as day,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'done') as done,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                    COALESCE(SUM(repair_amount) FILTER (WHERE status = 'done'), 0) as revenue,
                    COALESCE(SUM(purchase_amount) FILTER (WHERE status = 'done'), 0) as costs,
                    COALESCE(SUM(master_income) FILTER (WHERE status = 'done'), 0) as master_income
                FROM {SCHEMA}.repair_orders
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY day
                ORDER BY day DESC
            """)
            rows = cur.fetchall()
            cur.close(); conn.close()
            stats = [
                {
                    'day': str(r[0]), 'total': r[1], 'done': r[2],
                    'cancelled': r[3], 'revenue': int(r[4]), 'costs': int(r[5]),
                    'profit': int(r[4]) - int(r[5]),
                    'master_income': int(r[6]),
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'stats': stats}, ensure_ascii=False)}

        # Получить тему сайта (публичный — без токена не дойдёт, но action доступен)
        if action == 'theme_get':
            cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key = 'site_theme'")
            row = cur.fetchone()
            cur.close(); conn.close()
            if row and row[0]:
                import json as _json
                try:
                    theme_data = _json.loads(row[0])
                except Exception:
                    theme_data = None
                return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'theme': theme_data}, ensure_ascii=False)}
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'theme': None}, ensure_ascii=False)}

        # Настройки системы
        if action == 'settings_get':
            cur.execute(f"SELECT key, value, description, updated_at FROM {SCHEMA}.settings ORDER BY key")
            rows = cur.fetchall()
            cur.close(); conn.close()
            settings = [{'key': r[0], 'value': r[1], 'description': r[2], 'updated_at': r[3].isoformat() if r[3] else None} for r in rows]
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'settings': settings}, ensure_ascii=False)}

        # Цены работ + наценка на детали + доп. работы
        if action == 'labor_prices_get':
            cur.execute(f"SELECT part_type, label, price FROM {SCHEMA}.repair_labor_prices ORDER BY part_type")
            rows = cur.fetchall()
            cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='parts_markup'")
            mrow = cur.fetchone()
            markup = int(mrow[0]) if mrow else 0
            cur.execute(f"SELECT id, label, price, is_active, sort_order FROM {SCHEMA}.repair_extra_works ORDER BY sort_order, id")
            erows = cur.fetchall()
            extra = [{'id': r[0], 'label': r[1], 'price': r[2], 'is_active': r[3], 'sort_order': r[4]} for r in erows]
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(
                {'prices': [{'part_type': r[0], 'label': r[1], 'price': r[2]} for r in rows],
                 'parts_markup': markup, 'extra_works': extra},
                ensure_ascii=False
            )}

        # Список получателей уведомлений
        if action == 'recipients':
            cur.execute(
                f"SELECT id, name, telegram_chat_id, is_active, notify_repair, created_at FROM {SCHEMA}.notification_recipients ORDER BY created_at"
            )
            rows = cur.fetchall()
            cur.close(); conn.close()
            recipients = [
                {'id': r[0], 'name': r[1], 'telegram_chat_id': r[2], 'is_active': r[3], 'notify_repair': r[4], 'created_at': r[5].isoformat() if r[5] else None}
                for r in rows
            ]
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'recipients': recipients}, ensure_ascii=False)}

        # SMS контакты для рассылки
        if action == 'sms_contacts':
            group = params.get('group', 'all')

            def fmt_phone(raw: str) -> str:
                digits = ''.join(c for c in (raw or '') if c.isdigit())
                if len(digits) == 11 and digits.startswith('8'):
                    digits = '7' + digits[1:]
                if len(digits) == 10:
                    digits = '7' + digits
                return ('+' + digits) if len(digits) == 11 else ''

            contacts = []
            seen_phones = set()
            if group in ('all', 'registered'):
                cur.execute(f"SELECT id, full_name, phone FROM {SCHEMA}.clients WHERE (client_group IS NULL OR client_group != 'wh') ORDER BY registered_at DESC")
                for r in cur.fetchall():
                    p = fmt_phone(r[2] or '')
                    if p and p not in seen_phones:
                        contacts.append({'id': f'c_{r[0]}', 'full_name': r[1] or '', 'phone': p, 'source': 'registered'})
                        seen_phones.add(p)
            if group in ('all', 'repair'):
                cur.execute(
                    "SELECT id, name, phone FROM " + SCHEMA + ".repair_orders"
                    " WHERE status NOT IN ('cancelled')"
                    " AND phone IS NOT NULL AND phone != '' AND LENGTH(phone) >= 11"
                    " ORDER BY id DESC"
                )
                for r in cur.fetchall():
                    p = fmt_phone((r[2] or '').strip())
                    if p and p not in seen_phones:
                        contacts.append({'id': f'r_{r[0]}', 'full_name': r[1] or '', 'phone': p, 'source': 'repair'})
                        seen_phones.add(p)
            if group in ('all', 'wh'):
                cur.execute(f"SELECT id, full_name, phone FROM {SCHEMA}.clients WHERE client_group = 'wh' ORDER BY full_name")
                for r in cur.fetchall():
                    p = fmt_phone(r[2] or '')
                    if p and p not in seen_phones:
                        contacts.append({'id': f'c_{r[0]}', 'full_name': r[1] or '', 'phone': p, 'source': 'wh'})
                        seen_phones.add(p)
            cur.close(); conn.close()
            print(f"[sms_contacts] group={group} total={len(contacts)}", flush=True)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'contacts': contacts, 'total': len(contacts)}, ensure_ascii=False)}

        # Список заявок
        status_filter = params.get('status', '')
        search = params.get('search', '')
        date_from = params.get('date_from', '')
        date_to = params.get('date_to', '')

        conditions = []
        if status_filter:
            conditions.append(f"status = '{status_filter}'")
        if search:
            s = search.replace("'", "''")
            conditions.append(f"(name ILIKE '%{s}%' OR phone ILIKE '%{s}%' OR model ILIKE '%{s}%')")
        if date_from:
            conditions.append(f"DATE(created_at + INTERVAL '3 hours') >= '{date_from}'")
        if date_to:
            conditions.append(f"DATE(created_at + INTERVAL '3 hours') <= '{date_to}'")

        where = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''
        cur.execute(
            f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at, comment, purchase_amount, repair_amount, completed_at, master_income, parts_name, picked_up_at, advance, is_paid, payment_method FROM {SCHEMA}.repair_orders {where} ORDER BY created_at DESC LIMIT 500"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()

        orders = [
            {
                'id': r[0], 'name': r[1], 'phone': r[2], 'model': r[3],
                'repair_type': r[4], 'price': r[5], 'status': r[6],
                'admin_note': r[7], 'created_at': r[8].isoformat() if r[8] else None,
                'comment': r[9], 'purchase_amount': r[10], 'repair_amount': r[11],
                'completed_at': r[12].isoformat() if r[12] else None,
                'master_income': r[13], 'parts_name': r[14],
                'picked_up_at': r[15].isoformat() if r[15] else None,
                'advance': r[16], 'is_paid': r[17], 'payment_method': r[18],
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    if method == 'POST':
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
        action = body.get('action', 'update_status')

        # Сохранить тему сайта
        if action == 'theme_set':
            import json as _json
            theme_obj = body.get('theme')  # None = отключить глобальную тему
            enabled = body.get('enabled', True)
            if not enabled or theme_obj is None:
                cur.execute(f"INSERT INTO {SCHEMA}.settings (key, value, description) VALUES ('site_theme', NULL, 'Глобальная тема сайта для всех посетителей') ON CONFLICT (key) DO UPDATE SET value = NULL, updated_at = NOW()")
            else:
                theme_json = _json.dumps(theme_obj, ensure_ascii=False)
                cur.execute(f"INSERT INTO {SCHEMA}.settings (key, value, description) VALUES ('site_theme', '{theme_json.replace(chr(39), chr(39)*2)}', 'Глобальная тема сайта для всех посетителей') ON CONFLICT (key) DO UPDATE SET value = '{theme_json.replace(chr(39), chr(39)*2)}', updated_at = NOW()")
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Сохранение цен работ + наценки + доп. работ + мгновенный пересчёт repair_parts
        if action == 'labor_prices_set':
            prices = body.get('prices', [])
            for item in prices:
                pt = str(item.get('part_type', '')).strip()
                price_val = int(item.get('price', 0))
                if pt:
                    cur.execute(f"UPDATE {SCHEMA}.repair_labor_prices SET price={price_val}, updated_at=NOW() WHERE part_type='{pt}'")
                    # Мгновенно обновляем labor_cost во всех запчастях этого типа
                    cur.execute(f"UPDATE {SCHEMA}.repair_parts SET labor_cost={price_val} WHERE part_type='{pt}'")
            if 'parts_markup' in body:
                markup_val = int(body.get('parts_markup', 0))
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.settings (key, value, description)
                    VALUES ('parts_markup', '{markup_val}', 'Наценка на запчасти для ремонта (руб)')
                    ON CONFLICT (key) DO UPDATE SET value='{markup_val}', updated_at=NOW()
                """)
            # Сохраняем доп. работы
            extra = body.get('extra_works', [])
            for ew in extra:
                eid = ew.get('id')
                elabel = str(ew.get('label', '')).replace("'", "''").strip()
                eprice = int(ew.get('price', 0))
                eactive = bool(ew.get('is_active', True))
                esort = int(ew.get('sort_order', 0))
                if eid:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.repair_extra_works
                        SET label='{elabel}', price={eprice}, is_active={eactive}, sort_order={esort}
                        WHERE id={eid}
                    """)
                elif elabel:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.repair_extra_works (label, price, is_active, sort_order)
                        VALUES ('{elabel}', {eprice}, {eactive}, {esort})
                    """)
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Удаление доп. работы
        if action == 'extra_work_delete':
            eid = int(body.get('id', 0))
            if eid:
                cur.execute(f"DELETE FROM {SCHEMA}.repair_extra_works WHERE id={eid}")
                conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Регистрация клиента (публичный action — без токена)
        if action == 'client_register':
            full_name = str(body.get('full_name', '')).strip().replace("'", "''")
            phone = ''.join(c for c in str(body.get('phone', '')) if c.isdigit())
            birth_date = str(body.get('birth_date', '')).strip()
            ref_phone = ''.join(c for c in str(body.get('referrer_phone', '')) if c.isdigit())
            if not full_name or len(phone) < 10:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'ФИО и телефон обязательны'}, ensure_ascii=False)}
            # Ищем реферера
            referrer_id = 'NULL'
            if ref_phone and len(ref_phone) >= 10:
                ref_suffix = ref_phone[-10:]
                cur.execute(f"SELECT id FROM {SCHEMA}.repair_clients WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)='{ref_suffix}'")
                ref_row = cur.fetchone()
                if ref_row:
                    referrer_id = str(ref_row[0])
                    # Обновляем скидку реферера до 5%
                    cur.execute(f"UPDATE {SCHEMA}.repair_clients SET discount_pct=GREATEST(discount_pct, 5) WHERE id={ref_row[0]}")
            bd_val = f"'{birth_date}'" if birth_date else 'NULL'
            cur.execute(f"""
                INSERT INTO {SCHEMA}.repair_clients (full_name, phone, birth_date, referrer_id, discount_pct)
                VALUES ('{full_name}', '+{phone}', {bd_val}, {referrer_id}, 3)
                ON CONFLICT (phone) DO UPDATE SET full_name=EXCLUDED.full_name, birth_date=EXCLUDED.birth_date
                RETURNING id, discount_pct
            """)
            row = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'client_id': row[0], 'discount_pct': row[1]}, ensure_ascii=False)}

        # Баланс sms.ru + цена за SMS
        if action == 'sms_balance':
            api_id = os.environ.get('SMSRU_API_ID', '')
            if not api_id:
                cur.close(); conn.close()
                return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'SMSRU_API_ID не задан'}, ensure_ascii=False)}
            balance_resp = requests.get('https://sms.ru/my/balance', params={'api_id': api_id, 'json': 1}, timeout=10)
            balance_data = balance_resp.json() if balance_resp.status_code == 200 else {}
            cost_resp = requests.get('https://sms.ru/sms/cost', params={'api_id': api_id, 'to': '79999999999', 'msg': 'test', 'json': 1, 'from': 'IPMamedov'}, timeout=10)
            cost_data = cost_resp.json() if cost_resp.status_code == 200 else {}
            sms_cost = None
            if cost_data.get('status') == 'OK':
                for phone_info in cost_data.get('sms', {}).values():
                    if isinstance(phone_info, dict):
                        sms_cost = phone_info.get('cost')
                        break
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'balance': balance_data.get('balance'), 'sms_cost': sms_cost}, ensure_ascii=False)}

        # Тест SMS
        if action == 'sms_test':
            phone = (body.get('phone') or '').strip()
            message = (body.get('message') or 'Тестовое SMS от Скупка24 — всё работает!').strip()
            if not phone:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите phone'}, ensure_ascii=False)}
            api_id = os.environ.get('SMSRU_API_ID', '')
            if not api_id:
                cur.close(); conn.close()
                return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'SMSRU_API_ID не задан'}, ensure_ascii=False)}
            resp = requests.get(
                'https://sms.ru/sms/send',
                params={'api_id': api_id, 'to': phone, 'msg': message, 'json': 1},
                timeout=15
            )
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'smsru_response': resp.json()}, ensure_ascii=False)}

        # SMS рассылка
        if action == 'sms_blast':
          try:
            print(f"[sms_blast] start group={body.get('group')} msg_len={len(body.get('message',''))}", flush=True)
            message = (body.get('message') or '').strip()
            group = body.get('group', 'all')
            if not message:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Текст сообщения обязателен'}, ensure_ascii=False)}
            if len(message) > 480:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Сообщение слишком длинное (макс 480 символов)'}, ensure_ascii=False)}
            api_id = os.environ.get('SMSRU_API_ID', '')
            if not api_id:
                cur.close(); conn.close()
                return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'SMS сервис не настроен'}, ensure_ascii=False)}

            def fmt_p(raw: str) -> str:
                digits = ''.join(c for c in (raw or '') if c.isdigit())
                if len(digits) == 11 and digits.startswith('8'):
                    digits = '7' + digits[1:]
                if len(digits) == 10:
                    digits = '7' + digits
                return ('+' + digits) if len(digits) == 11 else ''

            phones = set()
            if group in ('all', 'registered'):
                cur.execute(f"SELECT phone FROM {SCHEMA}.clients WHERE (client_group IS NULL OR client_group != 'wh')")
                for r in cur.fetchall():
                    p = fmt_p(r[0] or '')
                    if p: phones.add(p)
            if group in ('all', 'repair'):
                cur.execute(
                    "SELECT DISTINCT phone FROM " + SCHEMA + ".repair_orders"
                    " WHERE status NOT IN ('cancelled') AND phone IS NOT NULL AND LENGTH(phone) >= 11"
                )
                for r in cur.fetchall():
                    p = fmt_p((r[0] or '').strip())
                    if p: phones.add(p)
            if group in ('all', 'wh'):
                cur.execute(f"SELECT phone FROM {SCHEMA}.clients WHERE client_group = 'wh'")
                for r in cur.fetchall():
                    p = fmt_p(r[0] or '')
                    if p: phones.add(p)
            cur.close(); conn.close()
            all_phones = list(phones)
            sent = 0; failed = 0
            # sms.ru поддерживает до 100 номеров в одном запросе через запятую
            chunk_size = 100
            for i in range(0, len(all_phones), chunk_size):
                chunk = all_phones[i:i + chunk_size]
                try:
                    resp = requests.get('https://sms.ru/sms/send',
                        params={'api_id': api_id, 'to': ','.join(chunk), 'msg': message, 'json': 1, 'from': 'IPMamedov'},
                        timeout=20)
                    data_r = resp.json() if resp.status_code == 200 else {}
                    print(f"[sms_blast] chunk resp status={data_r.get('status')} status_code={resp.status_code} body={str(data_r)[:300]}", flush=True)
                    if data_r.get('status') == 'OK':
                        sms_items = data_r.get('sms', {})
                        for num, info in sms_items.items():
                            if isinstance(info, dict) and info.get('status') == 'OK':
                                sent += 1
                            else:
                                failed += 1
                    else:
                        failed += len(chunk)
                except Exception:
                    failed += len(chunk)
            print(f"[sms_blast] sent={sent} failed={failed} total={len(all_phones)}", flush=True)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'sent': sent, 'failed': failed, 'total': len(all_phones)}, ensure_ascii=False)}
          except Exception as e:
            import traceback
            print(f"[sms_blast] EXCEPTION: {e}\n{traceback.format_exc()}", flush=True)
            return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': f'Внутренняя ошибка: {e}'}, ensure_ascii=False)}

        # Импорт WH-контактов из WhatsApp чата (Яндекс Диск)
        if action == 'import_wh_contacts':
            import re
            yd_url = (body.get('url') or '').strip()
            if not yd_url:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'url required'}, ensure_ascii=False)}
            # Получить прямую ссылку через API Яндекс Диска
            api_resp = requests.get(
                'https://cloud-api.yandex.net/v1/disk/public/resources/download',
                params={'public_key': yd_url}, timeout=15
            )
            if api_resp.status_code != 200:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Не удалось получить ссылку с Яндекс Диска'}, ensure_ascii=False)}
            download_href = api_resp.json().get('href', '')
            if not download_href:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Нет ссылки для скачивания'}, ensure_ascii=False)}
            file_resp = requests.get(download_href, timeout=30)
            text = file_resp.content.decode('utf-8', errors='ignore')
            # Извлечь все уникальные российские мобильные номера
            raw_numbers = re.findall(r'\b(?:\+?7|8)(9\d{9})\b', text)
            unique_phones = list(dict.fromkeys(['7' + n for n in raw_numbers]))
            if not unique_phones:
                cur.close(); conn.close()
                return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'imported': 0, 'skipped': 0}, ensure_ascii=False)}
            # Получить уже существующие WH-номера
            cur.execute(f"SELECT phone FROM {SCHEMA}.clients WHERE client_group = 'wh'")
            existing = set(r[0] for r in cur.fetchall())
            # Получить максимальный номер WH
            cur.execute(f"SELECT full_name FROM {SCHEMA}.clients WHERE client_group = 'wh' ORDER BY id DESC LIMIT 1")
            last_row = cur.fetchone()
            last_num = 0
            if last_row:
                m = re.search(r'(\d+)$', last_row[0] or '')
                if m:
                    last_num = int(m.group(1))
            imported = 0; skipped = 0
            for phone in unique_phones:
                normalized = phone
                if normalized in existing:
                    skipped += 1
                    continue
                last_num += 1
                name = f'WH{last_num}'
                cur.execute(
                    f"INSERT INTO {SCHEMA}.clients (full_name, phone, client_group) VALUES ('{name}', '{normalized}', 'wh') ON CONFLICT DO NOTHING"
                )
                existing.add(normalized)
                imported += 1
            conn.commit(); cur.close(); conn.close()
            print(f"[import_wh_contacts] imported={imported} skipped={skipped}", flush=True)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'imported': imported, 'skipped': skipped}, ensure_ascii=False)}

        # Сохранить настройку
        if action == 'settings_set':
            key = (body.get('key') or '').strip()
            value = str(body.get('value') or '').strip()
            if not key:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'key required'}, ensure_ascii=False)}
            cur.execute(f"UPDATE {SCHEMA}.settings SET value='{value}', updated_at=NOW() WHERE key='{key}' RETURNING key")
            row = cur.fetchone()
            if not row:
                conn.commit(); cur.close(); conn.close()
                return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'setting not found'}, ensure_ascii=False)}
            updated_count = 0
            if key == 'price_markup':
                new_markup = int(value)
                cur.execute(
                    f"UPDATE {SCHEMA}.catalog SET price = original_price + {new_markup}, updated_at = NOW() WHERE original_price IS NOT NULL AND is_active = true"
                )
                updated_count = cur.rowcount
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'key': key, 'value': value, 'prices_updated': updated_count}, ensure_ascii=False)}

        # Добавить получателя уведомлений
        if action == 'add_recipient':
            if not is_owner(event):
                cur.close(); conn.close()
                return {'statusCode': 403, 'headers': HEADERS, 'body': json.dumps({'error': 'Только владелец'}, ensure_ascii=False)}
            name = (body.get('name') or '').strip()
            chat_id_val = (body.get('telegram_chat_id') or '').strip()
            if not name or not chat_id_val:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите имя и chat_id'}, ensure_ascii=False)}
            cur.execute(
                f"INSERT INTO {SCHEMA}.notification_recipients (name, telegram_chat_id) VALUES ('{name}', '{chat_id_val}') RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'id': new_id}, ensure_ascii=False)}

        # Удалить получателя уведомлений
        if action == 'delete_recipient':
            if not is_owner(event):
                cur.close(); conn.close()
                return {'statusCode': 403, 'headers': HEADERS, 'body': json.dumps({'error': 'Только владелец'}, ensure_ascii=False)}
            rid = int(body.get('id', 0))
            cur.execute(f"DELETE FROM {SCHEMA}.notification_recipients WHERE id = {rid}")
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Переключить активность получателя
        if action == 'toggle_recipient':
            if not is_owner(event):
                cur.close(); conn.close()
                return {'statusCode': 403, 'headers': HEADERS, 'body': json.dumps({'error': 'Только владелец'}, ensure_ascii=False)}
            rid = int(body.get('id', 0))
            cur.execute(f"UPDATE {SCHEMA}.notification_recipients SET is_active = NOT is_active WHERE id = {rid} RETURNING is_active")
            row = cur.fetchone()
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'is_active': row[0] if row else False}, ensure_ascii=False)}

        # Создать заявку
        if action == 'create':
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            if not name or not phone:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False)}
            model = (body.get('model') or '').strip()
            repair_type = (body.get('repair_type') or '').strip()
            price = body.get('price')
            comment = (body.get('comment') or '').strip()
            price_val = int(price) if price else 'NULL'
            model_val = f"'{model}'" if model else 'NULL'
            repair_type_val = f"'{repair_type}'" if repair_type else 'NULL'
            comment_val = f"'{comment}'" if comment else 'NULL'
            price_str = f"{int(price):,} ₽".replace(',', ' ') if price else 'не определена'
            suffix = ''.join(c for c in phone if c.isdigit())[-10:]
            cur.execute(f"SELECT chat_id FROM {SCHEMA}.tg_phone_map WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}' LIMIT 1")
            prow = cur.fetchone()
            client_chat_id = prow[0] if prow else None
            cur.execute(
                f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment, client_tg_chat_id) VALUES ('{name}', '{phone}', {model_val}, {repair_type_val}, {price_val}, {comment_val}, {'NULL' if not client_chat_id else client_chat_id}) RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            main_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
            tg_msg = (
                f"🔧 *Заявка #{new_id} на ремонт — Скупка24*\n\n"
                f"👤 *Имя:* {name}\n📞 *Телефон:* {phone}\n"
                f"📱 *Модель:* {model or '—'}\n🛠 *Тип ремонта:* {repair_type or '—'}\n"
                f"💰 *Стоимость:* {price_str}"
                + (f"\n📝 *Комментарий:* {comment}" if comment else "")
                + f"\n\n🔑 ID заявки: `{new_id}`"
                + ("\n✅ Клиент в TG" if client_chat_id else "")
            )
            if tg_token and main_chat:
                send_tg_all(tg_token, main_chat, conn, tg_msg)
                html_bytes = build_act_html(new_id, name, phone, model, repair_type, price_str, comment)
                filename = f'Акт_приёмки_{new_id}_{name.replace(" ", "_")}.html'
                recipients = [main_chat]
                try:
                    cur3 = conn.cursor()
                    cur3.execute(f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active=true AND notify_repair=true")
                    for row in cur3.fetchall():
                        if row[0] and row[0] not in recipients:
                            recipients.append(row[0])
                    cur3.close()
                except Exception:
                    pass
                pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
                if pluxan and pluxan not in recipients:
                    recipients.append(pluxan)
                for cid in recipients:
                    send_tg_document(tg_token, cid, html_bytes, filename, caption=f'📋 Акт приёмки №{new_id} — открыть и распечатать')
            # SMS при создании НЕ отправляем — только Telegram
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'id': new_id}, ensure_ascii=False)}

        # Отправить акт в Telegram
        if action == 'send_act':
            order_id = int(body.get('id', 0))
            cur.execute(f"SELECT name, phone, model, repair_type, price, comment, advance, is_paid FROM {SCHEMA}.repair_orders WHERE id = {order_id}")
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close()
                return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}
            name, phone, model, repair_type, price, comment, advance, is_paid = row
            price_str = f"{int(price):,} ₽".replace(',', ' ') if price else 'не определена'
            html_bytes = build_act_html(order_id, name or '', phone or '', model or '', repair_type or '', price_str, comment or '', advance or 0, is_paid or False)
            filename = f'Акт_приёмки_{order_id}_{(name or "клиент").replace(" ", "_")}.html'
            tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            main_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
            recipients = [main_chat] if main_chat else []
            try:
                cur2 = conn.cursor()
                cur2.execute(f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active=true AND notify_repair=true")
                for r2 in cur2.fetchall():
                    if r2[0] and r2[0] not in recipients:
                        recipients.append(r2[0])
                cur2.close()
            except Exception:
                pass
            pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
            if pluxan and pluxan not in recipients:
                recipients.append(pluxan)
            sent = 0
            for cid in recipients:
                send_tg_document(tg_token, cid, html_bytes, filename, caption=f'📋 Акт приёмки №{order_id} — {name} — открыть и распечатать')
                sent += 1
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'sent_to': sent}, ensure_ascii=False)}

        # Удалить заявку
        if action == 'delete':
            order_id = int(body.get('id', 0))
            cur.execute(f"DELETE FROM {SCHEMA}.repair_orders WHERE id = {order_id}")
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Обновить статус / поля заявки
        order_id = int(body.get('id', 0))
        new_status = body.get('status', '')
        admin_note = body.get('admin_note')
        purchase_amount = body.get('purchase_amount')
        repair_amount = body.get('repair_amount')
        parts_name = body.get('parts_name')
        upd_advance = body.get('advance')
        upd_is_paid = body.get('is_paid')
        # Базовые поля заявки
        upd_name = body.get('name')
        upd_phone = body.get('phone')
        upd_model = body.get('model')
        upd_repair_type = body.get('repair_type')
        upd_price = body.get('price')
        upd_comment = body.get('comment')

        if new_status and new_status not in VALID_STATUSES:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный статус'}, ensure_ascii=False)}

        # При переводе в ready — обязательные поля
        if new_status == 'ready':
            if not purchase_amount and purchase_amount != 0:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите сумму закупки запчасти', 'field': 'purchase_amount'}, ensure_ascii=False)}
            if not repair_amount and repair_amount != 0:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите выданную сумму за ремонт', 'field': 'repair_amount'}, ensure_ascii=False)}
            if not parts_name:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите купленную запчасть', 'field': 'parts_name'}, ensure_ascii=False)}

        # Рассчитываем доход мастера = 50% от (repair_amount - purchase_amount)
        master_income_val = 'NULL'
        if repair_amount is not None and purchase_amount is not None:
            profit_raw = int(repair_amount) - int(purchase_amount)
            master_income_calc = max(0, round(profit_raw * 0.5))
            master_income_val = str(master_income_calc)

        # Строим SET-часть динамически
        sets = []
        if new_status:
            sets.append(f"status = '{new_status}'")
            sets.append("status_updated_at = NOW()")
            if new_status in ('ready', 'done'):
                sets.append("completed_at = NOW()")
        if admin_note is not None:
            note_escaped = str(admin_note).replace("'", "''")
            sets.append(f"admin_note = '{note_escaped}'")
        if purchase_amount is not None:
            sets.append(f"purchase_amount = {int(purchase_amount)}")
        if repair_amount is not None:
            sets.append(f"repair_amount = {int(repair_amount)}")
        if parts_name is not None:
            parts_escaped = str(parts_name).replace("'", "''")
            sets.append(f"parts_name = '{parts_escaped}'")
        if master_income_val != 'NULL':
            sets.append(f"master_income = {master_income_val}")
        # Базовые поля заявки
        if upd_name is not None:
            sets.append(f"name = '{str(upd_name).replace(chr(39), chr(39)*2)}'")
        if upd_phone is not None:
            sets.append(f"phone = '{str(upd_phone).replace(chr(39), chr(39)*2)}'")
        if upd_model is not None:
            if upd_model:
                sets.append(f"model = '{str(upd_model).replace(chr(39), chr(39)*2)}'")
            else:
                sets.append("model = NULL")
        if upd_repair_type is not None:
            if upd_repair_type:
                sets.append(f"repair_type = '{str(upd_repair_type).replace(chr(39), chr(39)*2)}'")
            else:
                sets.append("repair_type = NULL")
        if upd_price is not None:
            sets.append(f"price = {int(upd_price)}" if upd_price else "price = NULL")
        if upd_comment is not None:
            if upd_comment:
                sets.append(f"comment = '{str(upd_comment).replace(chr(39), chr(39)*2)}'")
            else:
                sets.append("comment = NULL")
        if upd_advance is not None:
            sets.append(f"advance = {int(upd_advance)}")
        if upd_is_paid is not None:
            sets.append(f"is_paid = {str(bool(upd_is_paid)).upper()}")
        upd_payment_method = body.get('payment_method')
        if upd_payment_method is not None:
            if upd_payment_method:
                pm = str(upd_payment_method).replace("'", "''")
                sets.append(f"payment_method = '{pm}'")
            else:
                sets.append("payment_method = NULL")

        if not sets:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False)}

        set_clause = ', '.join(sets)
        cur.execute(f"UPDATE {SCHEMA}.repair_orders SET {set_clause} WHERE id = {order_id} RETURNING id, name, phone, model, repair_type, repair_amount")
        row = cur.fetchone()
        conn.commit()

        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        # Отправляем Telegram уведомление при смене статуса
        if new_status:
            client_name = row[1] or ''
            client_phone = row[2] or ''
            device_model = row[3] or ''
            repair_t = row[4] or ''
            r_amount = row[5]
            status_label = STATUS_LABELS.get(new_status, new_status)
            tg_msg = (
                f"🔔 *Ремонт #{order_id} — Статус изменён*\n\n"
                f"📱 *Устройство:* {device_model or '—'}\n"
                f"🔧 *Тип ремонта:* {repair_t or '—'}\n"
                f"👤 *Клиент:* {client_name}\n"
                f"📞 *Телефон:* {client_phone}\n"
                f"📌 *Статус:* {status_label}"
                + (f"\n💰 *Стоимость ремонта:* {r_amount} ₽" if r_amount else "")
            )
            token = os.environ['TELEGRAM_BOT_TOKEN']
            main_chat_id = os.environ['TELEGRAM_CHAT_ID']
            send_tg_all(token, main_chat_id, conn, tg_msg)

            # SMS клиенту ТОЛЬКО при статусе "ready" (Готово к выдаче)
            if new_status == 'ready' and client_phone:
                dev = device_model or 'устройство'
                default_ready_tpl = 'Скупка24: {device} готов! Стоимость: {amount} руб. Ждём вас. Skypka24.com'
                cur2 = conn.cursor()
                cur2.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key = 'sms_tpl_ready'")
                row2 = cur2.fetchone()
                cur2.close()
                tpl = (row2[0] if row2 and row2[0] else default_ready_tpl)
                sms_text = tpl.replace('{device}', dev).replace('{amount}', str(r_amount or ''))
                send_sms(client_phone, sms_text)

            # При выдаче (done) — фиксируем дату получения
            if new_status == 'done':
                cur.execute(f"UPDATE {SCHEMA}.repair_orders SET picked_up_at = NOW() WHERE id = {order_id} AND picked_up_at IS NULL")
                conn.commit()

        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'master_income': int(master_income_val) if master_income_val != 'NULL' else None}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}