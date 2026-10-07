import json
import os
import hashlib
import re

import psycopg2
import requests

SCHEMA = 't_p31606708_tech_buying_service'
MAX_BOT_URL = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'
RESEND_MINUTES = 30
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Content-Type': 'application/json',
}

KIND_ICON = {
    'js': '🐞 Ошибка в коде',
    'promise': '🐞 Необработанная ошибка',
    'react': '💥 Сбой экрана',
    'api': '🌐 Ошибка сервера',
    'network': '📡 Нет связи с сервером',
    'resource': '🖼 Не загрузился файл',
}


def _resp(status, body):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(body, ensure_ascii=False)}


def _clip(v, n):
    return str(v or '')[:n]


def _fingerprint(kind, message, url):
    norm = re.sub(r'\d+', 'N', message)[:200]
    path = re.sub(r'[?#].*$', '', url or '')
    return hashlib.sha1(f'{kind}|{norm}|{path}'.encode('utf-8')).hexdigest()


def handler(event: dict, context) -> dict:
    """Принимает ошибки сайта и сохраняет в БД (в MAX не отправляются)."""
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'method not allowed'})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return _resp(400, {'error': 'bad json'})

    kind = _clip(body.get('kind') or 'js', 20)
    message = _clip(body.get('message'), 500).strip()
    if not message:
        return _resp(400, {'error': 'message required'})
    stack = _clip(body.get('stack'), 1500)
    url = _clip(body.get('url'), 300)
    ua = _clip(body.get('ua'), 200)
    employee = _clip(body.get('employee'), 100)
    fp = _fingerprint(kind, message, url)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SCHEMA}.error_reports (fingerprint, kind, message, stack, url, user_agent, employee)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (fingerprint) DO UPDATE
            SET count = {SCHEMA}.error_reports.count + 1, last_seen = NOW(),
                employee = COALESCE(NULLIF(EXCLUDED.employee, ''), {SCHEMA}.error_reports.employee)
            RETURNING id, count, last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '{RESEND_MINUTES} minutes'""",
        (fp, kind, message, stack, url, ua, employee),
    )
    rid, cnt, should_send = cur.fetchone()
    conn.commit()

    # Уведомления в MAX отключены: ошибки только сохраняются в БД
    sent = False
    cur.close()
    conn.close()
    return _resp(200, {'ok': True, 'id': rid, 'sent': sent})
