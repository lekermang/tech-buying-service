"""Отправка чека/квитанции на email клиенту.

Принимает HTML-контент чека и email получателя, отправляет красивое письмо
через Яндекс SMTP. Используется для чека ремонта и чека продажи из ломбарда.
"""
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token',
}

SMTP_HOST = 'smtp.yandex.ru'
SMTP_PORT = 465
SMTP_USER = 'info@skypka24.com'


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def has_access(headers_in: dict) -> bool:
    token = headers_in.get('x-admin-token', '') or headers_in.get('x-employee-token', '')
    return bool(token)


def build_email_html(check_type: str, subject_data: dict, check_html: str) -> str:
    """Оборачивает HTML чека в красивый email-шаблон."""
    title = subject_data.get('title', 'Квитанция Скупка24')
    order_id = subject_data.get('order_id', '')
    client_name = subject_data.get('client_name', '')

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <div style="max-width:680px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

    <!-- Шапка -->
    <div style="background:#111;padding:20px 32px;display:flex;align-items:center;gap:16px">
      <div>
        <div style="color:#FFD700;font-size:22px;font-weight:bold;letter-spacing:1px">Скупка24</div>
        <div style="color:#888;font-size:12px;margin-top:2px">г. Калуга · skypka24.com</div>
      </div>
      <div style="margin-left:auto;background:#FFD700;color:#000;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:bold">
        {title}
      </div>
    </div>

    <!-- Приветствие -->
    <div style="padding:24px 32px 16px;border-bottom:1px solid #eee">
      <div style="font-size:15px;color:#222;font-weight:bold;margin-bottom:6px">
        {'Здравствуйте, ' + client_name + '!' if client_name else 'Здравствуйте!'}
      </div>
      <div style="font-size:13px;color:#555;line-height:1.6">
        {'Ваш чек по заказу <b>#' + str(order_id) + '</b>' if order_id else 'Ваш документ'} прикреплён ниже.
        Сохраните это письмо для получения гарантийного обслуживания.
      </div>
    </div>

    <!-- Чек -->
    <div style="padding:24px 32px">
      {check_html}
    </div>

    <!-- Футер -->
    <div style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eee;text-align:center">
      <div style="font-size:11px;color:#999;line-height:1.8">
        ИП Мамедов Адиль Мирза Оглы · ИНН: 402810962699<br>
        г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
        Тел.: +7 (992) 990-33-33 · <a href="https://skypka24.com" style="color:#888">skypka24.com</a>
      </div>
    </div>
  </div>
</body>
</html>"""


def send_email(to_email: str, subject: str, html_body: str) -> None:
    password = os.environ.get('YANDEX_SMTP_PASSWORD', '')
    sender = SMTP_USER

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'Скупка24 <{sender}>'
    msg['To'] = to_email

    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(sender, password)
        server.sendmail(sender, to_email, msg.as_string())


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
