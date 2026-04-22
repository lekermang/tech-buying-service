import json
import os
import smtplib
import requests
import psycopg2
from email.mime.text import MIMEText

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
AD_FOOTER = "\n\n🌐 skypka24.com\n📲 https://t.me/ProService40"

STATUS_LABEL = {
    'in_progress':   'В работе',
    'waiting_parts': 'Ждём запчасть',
    'ready':         'Готово ✓',
    'done':          'Выдано',
    'cancelled':     'Отменено',
}

STATUS_MSG = {
    'in_progress':   'В работе 🔧 Ваш телефон принят и сейчас в ремонте. Сообщим, как только будет готово.',
    'waiting_parts': 'Ждём запчасть ⏳ Запчасть заказана, ожидаем поставку. Сразу приступим к ремонту.',
    'ready':         'Готово ✓ 🎉 Ваш телефон готов! Можно забирать в любое время.',
    'done':          'Выдано 👍 Спасибо за обращение! Рады видеть вас снова.',
    'cancelled':     'Отменено ❌ К сожалению, ремонт отменён. Свяжитесь с нами для уточнения деталей.',
}


def auth_staff(event: dict) -> bool:
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token_from_request = (hdrs.get('x-admin-token') or hdrs.get('x-employee-token') or '').strip()
    if not token_from_request:
        return False
    # Проверяем ADMIN_TOKEN
    if token_from_request == os.environ.get('ADMIN_TOKEN', ''):
        return True
    # Проверяем EMPLOYEE_TOKENS (env, для обратной совместимости)
    emp_raw = os.environ.get('EMPLOYEE_TOKENS', '')
    if emp_raw and token_from_request in {t.strip() for t in emp_raw.split(',') if t.strip()}:
        return True
    # Проверяем токен сотрудника в БД
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (token_from_request,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return row is not None
    except Exception:
        return False


def send_tg(token: str, chat_id, text: str, parse_mode: str = 'Markdown'):
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode},
            timeout=10,
        )
    except Exception:
        pass


def build_act_html(order_id, name, phone, model, repair_type, price_str, comment, advance=0, is_paid=False) -> bytes:
    import datetime
    now = datetime.datetime.now()
    date_str = now.strftime('%d.%m.%Y')
    time_str = now.strftime('%H:%M')
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
</style>
</head><body>
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
      <div class="f"><div class="fl">Аванс / Оплата:</div><div class="fvn">{paid_str}</div></div>
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

</div><!-- /page -->

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

</div><!-- /page2 -->
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


def send_sms(phone: str, text: str):
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return
    try:
        requests.get('https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': phone, 'msg': text, 'json': 1}, timeout=10)
    except Exception:
        pass


def send_email(to: str, subject: str, body: str):
    login = os.environ.get('YANDEX_SMTP_LOGIN', '')
    password = os.environ.get('YANDEX_SMTP_PASSWORD', '')
    if not login or not password:
        return
    try:
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = login
        msg['To'] = to
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(login, password)
            server.sendmail(login, [to], msg.as_string())
    except Exception:
        pass


def save_phone_map(cur, phone: str, chat_id: int, username: str, first_name: str):
    clean = '+' + ''.join(c for c in phone if c.isdigit())
    uname = (username or '').replace("'", "''")
    fname = (first_name or '').replace("'", "''")
    cur.execute(f"""
        INSERT INTO {SCHEMA}.tg_phone_map (phone, chat_id, username, first_name, updated_at)
        VALUES ('{clean}', {chat_id}, '{uname}', '{fname}', NOW())
        ON CONFLICT (phone) DO UPDATE SET
            chat_id=EXCLUDED.chat_id, username=EXCLUDED.username,
            first_name=EXCLUDED.first_name, updated_at=NOW()
    """)
    suffix = clean[-10:]
    cur.execute(f"""
        UPDATE {SCHEMA}.repair_orders
        SET client_tg_chat_id = {chat_id}
        WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}'
          AND client_tg_chat_id IS NULL
    """)


FUNC_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d"


def handler(event: dict, context) -> dict:
    """
    POST action=new_order      — создать заявку, уведомить команду
    POST action=notify         — отправить клиенту статус через бота (staff only)
    POST action=tg_webhook     — webhook Telegram бота @Skypkaklgbot
    GET  ?setup_webhook=1      — зарегистрировать webhook в Telegram
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token'}, 'body': ''}

    # Регистрация webhook
    params = event.get('queryStringParameters') or {}
    if params.get('setup_webhook'):
        token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        webhook_url = f"{FUNC_URL}?action=tg_webhook"
        r1 = requests.post(
            f'https://api.telegram.org/bot{token}/setWebhook',
            json={'url': webhook_url, 'allowed_updates': ['message', 'callback_query']},
            timeout=10,
        )
        # Кнопка «Открыть сайт» в меню бота
        r2 = requests.post(
            f'https://api.telegram.org/bot{token}/setChatMenuButton',
            json={'menu_button': {'type': 'web_app', 'text': '🌐 Открыть сайт', 'web_app': {'url': 'https://skypka24.com'}}},
            timeout=10,
        )
        # BotCommands
        r3 = requests.post(
            f'https://api.telegram.org/bot{token}/setMyCommands',
            json={'commands': [
                {'command': 'start',  'description': 'Главное меню'},
                {'command': 'status', 'description': 'Статус ремонта'},
                {'command': 'site',   'description': 'Открыть сайт'},
            ]},
            timeout=10,
        )
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({'webhook': r1.json(), 'menu_button': r2.json(), 'commands': r3.json()}, ensure_ascii=False)}

    raw = event.get('body') or '{}'
    body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    action = body.get('action', '') or params.get('action', 'new_order')
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')

    # ── Telegram Webhook от бота ──────────────────────────────────────────────
    is_tg_webhook = (
        action == 'tg_webhook'
        or 'message' in body
        or 'callback_query' in body
        or 'edited_message' in body
    )
    if is_tg_webhook:
        if not token:
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        import re as _re

        SITE = 'https://skypka24.com'

        STATUS_LABELS_TG = {
            'new':           '🔔 Заявка принята',
            'accepted':      '✅ Принят мастером',
            'in_progress':   '🔧 В работе',
            'waiting_parts': '📦 Ждём запчасть',
            'ready':         '🟡 Готово — можно забирать!',
            'done':          '✅ Выдано',
            'warranty':      '🛡 На гарантии',
            'cancelled':     '❌ Отменено',
        }
        STATUS_DESC_TG = {
            'new':           'Заявка зарегистрирована, ожидает приёмки мастером.',
            'accepted':      'Мастер принял устройство и приступает к диагностике.',
            'in_progress':   'Мастер работает над вашим устройством.',
            'waiting_parts': 'Ожидаем поступления необходимых запчастей.',
            'ready':         'Ремонт завершён! Приходите забирать устройство.',
            'done':          'Устройство выдано владельцу.',
            'warranty':      'Устройство находится на гарантийном обслуживании.',
            'cancelled':     'Заявка отменена.',
        }

        def tg_api(method, data):
            return requests.post(
                f'https://api.telegram.org/bot{token}/{method}',
                json=data, timeout=10
            )

        def main_menu_markup():
            return {'inline_keyboard': [
                [{'text': '🌐 Открыть полный сайт', 'web_app': {'url': SITE}}],
                [{'text': '📱 Продать технику',          'callback_data': 'sec_sell'}],
                [{'text': '💍 Сдать украшения',           'callback_data': 'sec_jewelry'}],
                [{'text': '🔧 Ремонт телефона',           'callback_data': 'sec_repair'}],
                [{'text': '🛒 Каталог Б/У техники',       'web_app': {'url': f'{SITE}/catalog'}}],
                [{'text': '🔍 Узнать статус ремонта',     'callback_data': 'sec_status'}],
                [{'text': '📍 Адреса и контакты',         'callback_data': 'sec_contacts'}],
            ]}

        def back_markup():
            return {'inline_keyboard': [[{'text': '← Главное меню', 'callback_data': 'sec_main'}]]}

        def order_markup(oid):
            return {'inline_keyboard': [
                [{'text': '🔄 Обновить статус', 'callback_data': f'order_{oid}'}],
                [{'text': '← Главное меню',     'callback_data': 'sec_main'}],
            ]}

        SECTIONS = {
            'sec_main': (
                '👋 <b>Добро пожаловать в Скупка24!</b>\n\nРаботаем <b>24/7</b> — выкупаем дорого, ремонтируем быстро.\n\nВыберите раздел:',
                main_menu_markup
            ),
            'sec_sell': (
                '📱 <b>Продать технику</b>\n\nВыкупаем дорого и быстро:\n• iPhone, Samsung, Xiaomi\n• MacBook, ноутбуки, iPad\n• Apple Watch, AirPods\n• Игровые консоли, фотоаппараты\n\n💰 <b>Цену назовём за 15 минут</b> после заявки',
                lambda: {'inline_keyboard': [
                    [{'text': '📝 Оставить заявку на сайте', 'url': SITE}],
                    [{'text': '📞 Позвонить: 8-800-707-40-40', 'url': 'tel:88007074040'}],
                    [{'text': '← Главное меню', 'callback_data': 'sec_main'}],
                ]}
            ),
            'sec_jewelry': (
                '💍 <b>Сдать ювелирные украшения</b>\n\nПринимаем:\n• Золото 585, 750, 999 пробы\n• Серебро\n• Бриллианты и драгоценные камни\n• Лом золота\n\n⚡️ Оценка и выплата — в день обращения',
                lambda: {'inline_keyboard': [
                    [{'text': '📝 Оставить заявку на сайте', 'url': SITE}],
                    [{'text': '📞 Позвонить: 8-800-707-40-40', 'url': 'tel:88007074040'}],
                    [{'text': '← Главное меню', 'callback_data': 'sec_main'}],
                ]}
            ),
            'sec_repair': (
                '🔧 <b>Ремонт телефонов</b>\n\nПри вас за 20 минут:\n• Замена стекла и дисплея — от 300 ₽\n• Замена аккумулятора\n• Ремонт разъёма зарядки\n• Чистка после воды\n\n🛡 <b>Бесплатная диагностика</b>\n✅ Оригинальные комплектующие',
                lambda: {'inline_keyboard': [
                    [{'text': '📋 Оставить заявку на ремонт', 'url': f'{SITE}/#repair'}],
                    [{'text': '🔍 Узнать статус ремонта',     'callback_data': 'sec_status'}],
                    [{'text': '📞 Позвонить',                  'url': 'tel:88007074040'}],
                    [{'text': '← Главное меню',               'callback_data': 'sec_main'}],
                ]}
            ),
            'sec_catalog': (
                '🛒 <b>Каталог Б/У техники</b>\n\nПроверенные устройства с гарантией <b>1 год</b>:\n• iPhone от 3 000 ₽\n• Samsung, Xiaomi\n• MacBook, ноутбуки\n• iPad, AirPods\n\nКаждое устройство проверено мастером.',
                lambda: {'inline_keyboard': [
                    [{'text': '🛒 Открыть каталог', 'url': f'{SITE}/catalog'}],
                    [{'text': '← Главное меню',     'callback_data': 'sec_main'}],
                ]}
            ),
            'sec_status': (
                '🔍 <b>Статус заявки на ремонт</b>\n\nОтправьте <b>номер заявки</b> (например: <code>42</code>)\nили <b>номер телефона</b>, указанный при сдаче.',
                back_markup
            ),
            'sec_contacts': (
                '📍 <b>Адреса (работаем 24/7)</b>\n\n🏪 <b>Кирова, 11</b>\n🏪 <b>Кирова, 7/47</b>\n\n📞 8-800-707-40-40 (бесплатно)\n🌐 skypka24.com',
                lambda: {'inline_keyboard': [
                    [{'text': '📞 Позвонить', 'url': 'tel:88007074040'}, {'text': '🌐 Сайт', 'url': SITE}],
                    [{'text': '← Главное меню', 'callback_data': 'sec_main'}],
                ]}
            ),
        }

        def get_order_info(order_id):
            try:
                conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
                cur2 = conn2.cursor()
                cur2.execute(
                    f"SELECT id, name, model, repair_type, status, admin_note FROM {SCHEMA}.repair_orders WHERE id = %s",
                    (order_id,)
                )
                row2 = cur2.fetchone()
                cur2.close(); conn2.close()
                return row2
            except Exception:
                return None

        def get_orders_by_phone_tg(phone_raw):
            digits = _re.sub(r'[^0-9]', '', phone_raw)[-7:]
            try:
                conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
                cur2 = conn2.cursor()
                cur2.execute(
                    f"""SELECT id, model, status FROM {SCHEMA}.repair_orders
                        WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s
                          AND status != 'cancelled'
                        ORDER BY created_at DESC LIMIT 5""",
                    ('%' + digits + '%',)
                )
                rows2 = cur2.fetchall()
                cur2.close(); conn2.close()
                return rows2
            except Exception:
                return []

        def format_order_tg(row2):
            oid, name, model, repair_type, status, admin_note = row2
            sl = STATUS_LABELS_TG.get(status, status)
            sd = STATUS_DESC_TG.get(status, '')
            lines = [f'📋 <b>Заявка #{oid}</b>']
            if name:   lines.append(f'👤 {name}')
            if model:  lines.append(f'📱 {model}')
            if repair_type: lines.append(f'🔧 {repair_type}')
            lines.append(f'\n{sl}')
            if sd: lines.append(f'<i>{sd}</i>')
            if admin_note: lines.append(f'\n💬 <b>Комментарий мастера:</b>\n{admin_note}')
            return '\n'.join(lines)

        # ── Callback query (нажатие кнопки) ──
        cb = body.get('callback_query')
        if cb:
            cb_id   = cb.get('id')
            cb_data = cb.get('data', '')
            cb_msg  = cb.get('message', {})
            cb_chat = cb_msg.get('chat', {}).get('id')
            cb_mid  = cb_msg.get('message_id')

            def edit_msg(text, markup):
                tg_api('editMessageText', {
                    'chat_id': cb_chat, 'message_id': cb_mid,
                    'text': text, 'parse_mode': 'HTML',
                    'reply_markup': markup, 'disable_web_page_preview': True,
                })
                tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

            # Обновить статус заявки
            if cb_data.startswith('order_'):
                oid = int(cb_data.split('_', 1)[1])
                row2 = get_order_info(oid)
                if row2:
                    edit_msg(f'🔍 <b>Статус вашей заявки:</b>\n\n{format_order_tg(row2)}', order_markup(oid))
                else:
                    edit_msg(f'⚠️ Заявка #{oid} не найдена.', back_markup())
                return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

            # Разделы меню
            if cb_data in SECTIONS:
                text2, kb_fn = SECTIONS[cb_data]
                edit_msg(text2, kb_fn())
                return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

            tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # ── Обычное сообщение ──
        message = body.get('message') or {}
        chat_id = message.get('chat', {}).get('id')
        if not chat_id:
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        chat_type = message.get('chat', {}).get('type', 'private')
        if chat_type != 'private':
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        from_user = message.get('from') or {}
        username   = from_user.get('username', '')
        first_name = from_user.get('first_name', '')
        text = (message.get('text') or '').strip()
        contact = message.get('contact')

        # Поделился номером — привязываем
        if contact and contact.get('phone_number'):
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            save_phone_map(cur, contact['phone_number'], chat_id, username, first_name)
            conn.commit()
            cur.close(); conn.close()
            tg_api('sendMessage', {
                'chat_id': chat_id,
                'text': f'✅ Телефон {contact["phone_number"]} привязан.\nТеперь вы будете получать уведомления о статусе ремонта.\n\n🌐 skypka24.com',
                'reply_markup': {'remove_keyboard': True},
            })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # /start [order_id]
        if text.startswith('/start'):
            param = text.split(' ', 1)[1].strip() if ' ' in text else ''
            if param == 'web_auth':
                # Обрабатывается отдельной функцией
                return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}
            if param and param.isdigit():
                row2 = get_order_info(int(param))
                if row2:
                    tg_api('sendMessage', {
                        'chat_id': chat_id,
                        'text': f'🔍 <b>Статус вашей заявки:</b>\n\n{format_order_tg(row2)}',
                        'parse_mode': 'HTML',
                        'reply_markup': order_markup(int(param)),
                    })
                else:
                    tg_api('sendMessage', {
                        'chat_id': chat_id,
                        'text': f'⚠️ Заявка #{param} не найдена.\n\nВведите номер заявки или номер телефона.',
                        'parse_mode': 'HTML',
                        'reply_markup': back_markup(),
                    })
                return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}
            # Обычный /start — главное меню
            tg_api('sendMessage', {
                'chat_id': chat_id,
                'text': '👋 <b>Добро пожаловать в Скупка24!</b>\n\nРаботаем <b>24/7</b> — выкупаем дорого, ремонтируем быстро.\n\nВыберите раздел:',
                'parse_mode': 'HTML',
                'reply_markup': main_menu_markup(),
                'disable_web_page_preview': True,
            })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # /site — открыть сайт
        if text.startswith('/site'):
            tg_api('sendMessage', {
                'chat_id': chat_id,
                'text': '🌐 <b>Сайт Скупка24</b>\n\nНажмите кнопку ниже, чтобы открыть полный сайт прямо здесь в Telegram:',
                'parse_mode': 'HTML',
                'reply_markup': {'inline_keyboard': [
                    [{'text': '🌐 Открыть skypka24.com', 'web_app': {'url': SITE}}],
                    [{'text': '← Главное меню', 'callback_data': 'sec_main'}],
                ]},
            })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # /status — статус ремонта
        if text.startswith('/status'):
            tg_api('sendMessage', {
                'chat_id': chat_id,
                'text': '🔍 <b>Статус заявки на ремонт</b>\n\nОтправьте <b>номер заявки</b> (например: <code>42</code>)\nили <b>номер телефона</b>, указанный при сдаче.',
                'parse_mode': 'HTML',
                'reply_markup': back_markup(),
            })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # Только цифры — статус заявки по ID
        if _re.fullmatch(r'\d{1,6}', text):
            row2 = get_order_info(int(text))
            if row2:
                tg_api('sendMessage', {
                    'chat_id': chat_id,
                    'text': f'🔍 <b>Статус вашей заявки:</b>\n\n{format_order_tg(row2)}',
                    'parse_mode': 'HTML',
                    'reply_markup': order_markup(int(text)),
                })
            else:
                tg_api('sendMessage', {
                    'chat_id': chat_id,
                    'text': f'⚠️ Заявка <b>#{text}</b> не найдена.\n\nПроверьте номер или введите номер телефона.',
                    'parse_mode': 'HTML',
                    'reply_markup': back_markup(),
                })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # Номер телефона — поиск заявок
        digits_all = _re.sub(r'[^0-9]', '', text)
        if len(digits_all) >= 7:
            rows2 = get_orders_by_phone_tg(text)
            if rows2:
                lines = [f'📋 Найдено заявок: <b>{len(rows2)}</b>\n']
                kb_rows = []
                for r2 in rows2:
                    r_id, r_model, r_status = r2
                    sl = STATUS_LABELS_TG.get(r_status, r_status)
                    model_part = f' — {r_model}' if r_model else ''
                    lines.append(f'• <b>#{r_id}</b>{model_part} · {sl}')
                    kb_rows.append([{'text': f'🔍 Заявка #{r_id}', 'callback_data': f'order_{r_id}'}])
                kb_rows.append([{'text': '← Главное меню', 'callback_data': 'sec_main'}])
                tg_api('sendMessage', {
                    'chat_id': chat_id,
                    'text': '\n'.join(lines),
                    'parse_mode': 'HTML',
                    'reply_markup': {'inline_keyboard': kb_rows},
                })
            else:
                tg_api('sendMessage', {
                    'chat_id': chat_id,
                    'text': '⚠️ По этому номеру заявок не найдено.\n\nВведите <b>номер заявки</b> или напишите /start.',
                    'parse_mode': 'HTML',
                    'reply_markup': back_markup(),
                })
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        # Всё остальное — главное меню
        tg_api('sendMessage', {
            'chat_id': chat_id,
            'text': '👋 <b>Добро пожаловать в Скупка24!</b>\n\nРаботаем <b>24/7</b> — выкупаем дорого, ремонтируем быстро.\n\nВыберите раздел:',
            'parse_mode': 'HTML',
            'reply_markup': main_menu_markup(),
            'disable_web_page_preview': True,
        })
        return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

    # ── SMS клиенту о статусе ────────────────────────────────────────────────
    if action == 'notify_sms':
        if not auth_staff(event):
            return {'statusCode': 401, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}
        order_id = int(body.get('order_id', 0))
        status_key = str(body.get('status_key', '')).strip()
        if not order_id or status_key not in STATUS_MSG:
            return {'statusCode': 400, 'headers': HEADERS,
                    'body': json.dumps({'error': 'order_id и status_key обязательны'}, ensure_ascii=False)}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, phone, repair_type, repair_amount FROM {SCHEMA}.repair_orders WHERE id = {order_id}")
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}
        _, name, phone, repair_type, repair_amount = row
        if not phone or not phone.startswith('+7'):
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': f'Телефон клиента не указан или не в формате +7: {phone}'}, ensure_ascii=False)}
        dev = repair_type or 'устройство'
        sms_templates = {
            'in_progress':   f"Скупка24: {dev} в ремонте. Готово — сообщим. Skypka24.com",
            'waiting_parts': f"Скупка24: {dev} — ждём запчасть. Готово — сообщим. Skypka24.com",
            'ready':         f"Скупка24: {dev} готов! Стоимость: {int(repair_amount) if repair_amount else '?'} руб. Ждём вас. Skypka24.com",
            'done':          f"Скупка24: {dev} выдан. Спасибо за обращение! Skypka24.com",
            'cancelled':     f"Скупка24: {dev} — ремонт отменён. Позвоните нам. Skypka24.com",
        }
        sms_text = sms_templates.get(status_key, '')
        api_id = os.environ.get('SMSRU_API_ID', '')
        if not api_id:
            return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'SMSRU_API_ID не задан'}, ensure_ascii=False)}
        resp = requests.get('https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': phone, 'msg': sms_text, 'json': 1, 'from': 'IPMamedov'}, timeout=10)
        d = resp.json() if resp.status_code == 200 else {}
        if d.get('status') == 'OK':
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'sent_to': name, 'phone': phone}, ensure_ascii=False)}
        else:
            return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': d.get('status_text', 'Ошибка SMS')}, ensure_ascii=False)}

    # ── Уведомить клиента о статусе ──────────────────────────────────────────
    if action == 'notify':
        if not auth_staff(event):
            return {'statusCode': 401, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

        order_id = int(body.get('order_id', 0))
        status_key = str(body.get('status_key', '')).strip()

        if not order_id or status_key not in STATUS_MSG:
            return {'statusCode': 400, 'headers': HEADERS,
                    'body': json.dumps({'error': 'order_id и status_key обязательны'}, ensure_ascii=False)}
        if not token:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN не задан'}, ensure_ascii=False)}

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, phone, repair_type, repair_amount, client_tg_chat_id
            FROM {SCHEMA}.repair_orders WHERE id = {order_id}
        """)
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        _, name, phone, repair_type, repair_amount, chat_id = row

        if not chat_id and phone:
            suffix = ''.join(c for c in phone if c.isdigit())[-10:]
            cur.execute(f"""
                SELECT chat_id FROM {SCHEMA}.tg_phone_map
                WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}' LIMIT 1
            """)
            prow = cur.fetchone()
            if prow:
                chat_id = prow[0]

        cur.close(); conn.close()

        if not chat_id:
            return {'statusCode': 404, 'headers': HEADERS,
                    'body': json.dumps({
                        'error': f'Клиент не писал боту @Skypkaklgbot. Попросите клиента написать /start боту.',
                        'phone': phone,
                    }, ensure_ascii=False)}

        msg = STATUS_MSG[status_key]
        amount_str = f"\nСтоимость ремонта: {int(repair_amount):,} ₽".replace(',', ' ') if repair_amount else ""
        text = f"🔧 *Скупка24 — ремонт #{order_id}*\n\n{msg}{amount_str}{AD_FOOTER}"

        resp = requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
            timeout=10,
        )
        tg_data = resp.json()
        if tg_data.get('ok'):
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps({'ok': True, 'sent_to': name, 'status': STATUS_LABEL[status_key]}, ensure_ascii=False)}
        else:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'error': tg_data.get('description', 'Ошибка Telegram')}, ensure_ascii=False)}

    # ── Создать новую заявку ─────────────────────────────────────────────────
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    model = body.get('model', '').strip()
    repair_type = body.get('repair_type', '').strip()
    price = body.get('price')
    comment = body.get('comment', '').strip()

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False)}

    # ── СОХРАНЕНИЕ В БД (транзакция — атомарно) ──────────────────────────────
    order_id = None
    client_chat_id = None
    conn = None
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.autocommit = False
        cur = conn.cursor()

        # Ищем chat_id по телефону
        suffix = ''.join(c for c in phone if c.isdigit())[-10:]
        cur.execute(f"""
            SELECT chat_id FROM {SCHEMA}.tg_phone_map
            WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}' LIMIT 1
        """)
        prow = cur.fetchone()
        client_chat_id = prow[0] if prow else None

        cur.execute(
            f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment, client_tg_chat_id) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (name, phone, model or None, repair_type or None, price, comment or None, client_chat_id)
        )
        order_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
    except Exception as db_err:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"[repair-order] DB ERROR name={name} phone={phone} err={db_err}")
        # Аварийно уведомляем в Telegram о потере заявки
        _emergency_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        _emergency_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
        if _emergency_token and _emergency_chat:
            try:
                requests.post(
                    f'https://api.telegram.org/bot{_emergency_token}/sendMessage',
                    json={'chat_id': _emergency_chat,
                          'text': f'🚨 *ОШИБКА БАЗЫ ДАННЫХ* — заявка НЕ сохранена!\n\n'
                                  f'👤 {name}\n📞 {phone}\n📱 {model or "—"}\n🛠 {repair_type or "—"}\n\n'
                                  f'Ошибка: `{db_err}`',
                          'parse_mode': 'Markdown'},
                    timeout=10
                )
            except Exception:
                pass
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'error': 'Ошибка сохранения заявки, попробуйте ещё раз'}, ensure_ascii=False)}
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    price_str = f'{int(price):,} ₽'.replace(',', ' ') if price else 'не определена'
    act_text = (
        f"📋 *АКТ ПРИЁМКИ №{order_id}* | Скупка24, Калуга\n\n"
        f"*Клиент:* {name} | *Тел:* {phone}\n"
        f"*Устройство:* {model or '—'} | *Работы:* {repair_type or '—'}\n"
        f"*Стоимость:* {price_str}"
        + (f" | *Коммент:* {comment}" if comment else "")
        + "\n\n*⚠️ Клиент ознакомлен и согласен:*\n"
        "1. После воды аппарат может умереть при любом ремонте — мастерская не обязана оживлять.\n"
        "2. Компонентная пайка — риск гибели платы; если умер в процессе — работа оплачивается.\n"
        "3. Снятие дисплея — риск полос/артефактов; замена за счёт клиента.\n"
        "4. Данные (фото, контакты) могут быть утеряны безвозвратно.\n"
        "5. Гарантии нет; в худшем случае оплачивается диагностика и выполненные работы.\n\n"
        f"*Подпись клиента:* ______________"
    )
    tg_text = (
        f"🔧 *Заявка #{order_id} на ремонт — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n📞 *Телефон:* {phone}\n"
        f"📱 *Модель:* {model or '—'}\n🛠 *Тип ремонта:* {repair_type or '—'}\n"
        f"💰 *Стоимость:* {price_str}"
        + (f"\n📝 *Комментарий:* {comment}" if comment else "")
        + f"\n\n🔑 ID заявки: `{order_id}`"
        + (f"\n✅ Клиент в TG" if client_chat_id else "")
    )

    # ── УВЕДОМЛЕНИЯ (не влияют на сохранение заявки) ─────────────────────────
    if token:
        try:
            conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
            cur2 = conn2.cursor()
            cur2.execute(
                f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active=true AND notify_repair=true"
            )
            chat_ids = [r[0] for r in cur2.fetchall()]
            cur2.close(); conn2.close()
        except Exception:
            chat_ids = []
        default_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
        if default_chat and default_chat not in chat_ids:
            chat_ids.insert(0, default_chat)
        try:
            html_bytes = build_act_html(order_id, name, phone, model, repair_type, price_str, comment)
            filename = f'Акт_приёмки_{order_id}_{name.replace(" ", "_")}.html'
            for cid in chat_ids:
                send_tg(token, cid, tg_text)
                send_tg_document(token, cid, html_bytes, filename, caption=f'📋 Акт приёмки №{order_id} — открыть и распечатать', mime='text/html')
        except Exception as tg_err:
            print(f"[repair-order] TG notify error order={order_id} err={tg_err}")

    if token and client_chat_id:
        try:
            client_msg = (
                f"✅ *Заявка #{order_id} принята!*\n\n"
                f"Здравствуйте, {name}!\n"
                f"📱 *Устройство:* {model or '—'}\n"
                f"🛠 *Работы:* {repair_type or '—'}\n"
                f"💰 *Стоимость:* {price_str}\n\n"
                f"Скоро перезвоним. Статус — командой /status{AD_FOOTER}"
            )
            send_tg(token, client_chat_id, client_msg)
        except Exception:
            pass

    send_sms('+79929990333', f'Заявка #{order_id} на ремонт. {name}, {phone}. {repair_type or model or ""}. Скупка24')
    send_email('lekermanya@yandex.ru', f'Заявка #{order_id} на ремонт — Скупка24',
        f"Заявка #{order_id}\nИмя: {name}\nТелефон: {phone}\nМодель: {model}\nТип: {repair_type}\nСтоимость: {price_str}")

    return {'statusCode': 200, 'headers': HEADERS,
            'body': json.dumps({'ok': True, 'order_id': order_id}, ensure_ascii=False)}