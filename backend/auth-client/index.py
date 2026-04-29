import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2
import requests

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
YANDEX_CLIENT_ID = os.environ.get('YANDEX_CLIENT_ID', '')
YANDEX_CLIENT_SECRET = os.environ.get('YANDEX_CLIENT_SECRET', '')


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def make_token():
    return secrets.token_hex(32)


def handler(event: dict, context) -> dict:
    """Регистрация и авторизация клиентов: по телефону/ФИО, Яндекс OAuth, получение профиля"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Client-Token, X-Admin-Token, X-Employee-Token'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    client_token = headers_in.get('x-client-token', '').strip()

    # GET /list — список всех клиентов (для admin по X-Admin-Token или для сотрудника по X-Employee-Token)
    if method == 'GET' and params.get('action') == 'list':
        admin_token = headers_in.get('x-admin-token', '').strip()
        emp_token = headers_in.get('x-employee-token', '').strip()
        expected = os.environ.get('ADMIN_TOKEN', '')
        is_admin = bool(admin_token) and admin_token == expected
        is_staff = False
        if not is_admin and emp_token:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT 1 FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (emp_token,))
            is_staff = cur.fetchone() is not None
            cur.close(); conn.close()
        if not (is_admin or is_staff):
            return _err(403, 'Нет доступа')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""SELECT id, full_name, phone, email, discount_pct, loyalty_points, registered_at
                        FROM {SCHEMA}.clients ORDER BY registered_at DESC NULLS LAST, id DESC""")
        rows = cur.fetchall(); cur.close(); conn.close()
        clients = [{'id': r[0], 'full_name': r[1], 'phone': r[2], 'email': r[3],
                    'discount_pct': r[4], 'loyalty_points': r[5],
                    'registered_at': r[6].isoformat() if r[6] else None} for r in rows]
        return _ok({'clients': clients, 'total': len(clients)})

    # GET /profile — получить профиль по токену или по номеру телефона (для сотрудников)
    if method == 'GET' and params.get('action') == 'profile':
        phone_param = params.get('phone', '').strip()
        conn = get_conn(); cur = conn.cursor()
        if phone_param:
            # поиск по телефону (публичный, для сотрудников)
            cur.execute(f"""SELECT id, full_name, phone, email, discount_pct, loyalty_points,
                            passport_series, passport_number, passport_issued_by, passport_issued_date, address, registered_at
                            FROM {SCHEMA}.clients WHERE phone=%s""", (phone_param,))
        else:
            if not client_token:
                return _err(401, 'Требуется токен')
            cur.execute(f"""SELECT id, full_name, phone, email, discount_pct, loyalty_points,
                            passport_series, passport_number, passport_issued_by, passport_issued_date, address, registered_at
                            FROM {SCHEMA}.clients WHERE auth_token=%s AND token_expires_at > NOW()""", (client_token,))
        row = cur.fetchone(); cur.close(); conn.close()
        if not row:
            return _err(404, 'Клиент не найден')
        return _ok({'id': row[0], 'full_name': row[1], 'phone': row[2], 'email': row[3],
                    'discount_pct': row[4], 'loyalty_points': row[5],
                    'passport_series': row[6], 'passport_number': row[7],
                    'passport_issued_by': row[8],
                    'passport_issued_date': str(row[9]) if row[9] else None,
                    'address': row[10],
                    'registered_at': row[11].isoformat() if row[11] else None})

    # POST /register — регистрация по телефону
    if method == 'POST' and body.get('action') == 'register':
        phone = body.get('phone', '').strip()
        full_name = body.get('full_name', '').strip()
        email = body.get('email', '').strip()
        if not phone or not full_name:
            return _err(400, 'Телефон и ФИО обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id, auth_token FROM {SCHEMA}.clients WHERE phone=%s", (phone,))
        existing = cur.fetchone()
        if existing:
            # уже есть — обновим токен и вернём
            token = make_token()
            expires = datetime.utcnow() + timedelta(days=90)
            cur.execute(f"UPDATE {SCHEMA}.clients SET auth_token=%s, token_expires_at=%s, full_name=%s, email=%s, updated_at=NOW() WHERE phone=%s", (token, expires, full_name, email or None, phone))
            conn.commit(); cur.close(); conn.close()
            return _ok({'token': token, 'is_new': False, 'message': 'Добро пожаловать!'})
        token = make_token()
        expires = datetime.utcnow() + timedelta(days=90)
        cur.execute(f"INSERT INTO {SCHEMA}.clients (full_name, phone, email, auth_token, token_expires_at) VALUES (%s,%s,%s,%s,%s) RETURNING id, discount_pct",
                    (full_name, phone, email or None, token, expires))
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return _ok({'token': token, 'is_new': True, 'client_id': row[0], 'discount_pct': row[1],
                    'message': f'Регистрация успешна! Ваша скидка {row[1]}%'})

    # POST /yandex — авторизация через Яндекс (обмен code на токен)
    if method == 'POST' and body.get('action') == 'yandex':
        code = body.get('code', '').strip()
        redirect_uri = body.get('redirect_uri', '').strip()
        if not code:
            return _err(400, 'Код авторизации отсутствует')
        # Получаем токен Яндекса
        resp = requests.post('https://oauth.yandex.ru/token', data={
            'grant_type': 'authorization_code', 'code': code,
            'client_id': YANDEX_CLIENT_ID, 'client_secret': YANDEX_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
        }, timeout=10)
        if resp.status_code != 200:
            return _err(400, 'Ошибка Яндекс OAuth')
        ya_token = resp.json().get('access_token')
        # Получаем данные пользователя
        info = requests.get('https://login.yandex.ru/info', headers={'Authorization': f'OAuth {ya_token}'}, timeout=10).json()
        yandex_id = str(info.get('id', ''))
        full_name = info.get('real_name') or info.get('display_name', '')
        email = info.get('default_email', '')
        phone = info.get('default_phone', {}).get('number', '') if info.get('default_phone') else ''

        conn = get_conn(); cur = conn.cursor()
        # Ищем по yandex_id
        cur.execute(f"SELECT id FROM {SCHEMA}.clients WHERE yandex_id=%s", (yandex_id,))
        existing = cur.fetchone()
        token = make_token()
        expires = datetime.utcnow() + timedelta(days=90)
        if existing:
            cur.execute(f"UPDATE {SCHEMA}.clients SET auth_token=%s, token_expires_at=%s, updated_at=NOW() WHERE id=%s", (token, expires, existing[0]))
            conn.commit(); cur.close(); conn.close()
            return _ok({'token': token, 'is_new': False})
        # Новый клиент — нужно заполнить телефон
        cur.execute(f"INSERT INTO {SCHEMA}.clients (full_name, phone, email, yandex_id, auth_token, token_expires_at) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, discount_pct",
                    (full_name, phone or f'ya_{yandex_id}', email, yandex_id, token, expires))
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return _ok({'token': token, 'is_new': True, 'client_id': row[0], 'discount_pct': row[1],
                    'needs_phone': not bool(phone), 'full_name': full_name, 'email': email})

    # PUT /update — обновление профиля (клиент по токену или сотрудник по client_id в body)
    if method == 'PUT':
        # Сотрудник может обновить паспорт клиента по client_id
        if body.get('client_id') and not client_token:
            conn = get_conn(); cur = conn.cursor()
            client_id = int(body['client_id'])
            fields, values = [], []
            for f in ('full_name', 'phone', 'email', 'address',
                      'passport_series', 'passport_number', 'passport_issued_by',
                      'passport_issued_date'):
                if f in body and body[f] is not None:
                    fields.append(f"{f}=%s"); values.append(body[f])
            if fields:
                values.append(client_id)
                cur.execute(f"UPDATE {SCHEMA}.clients SET {', '.join(fields)}, updated_at=NOW() WHERE id=%s", values)
                conn.commit()
            cur.close(); conn.close()
            return _ok({'ok': True})
        if not client_token:
            return _err(401, 'Требуется токен')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.clients WHERE auth_token=%s AND token_expires_at>NOW()", (client_token,))
        row = cur.fetchone()
        if not row:
            return _err(401, 'Токен недействителен')
        client_id = row[0]
        fields, values = [], []
        for f in ('full_name', 'phone', 'email', 'address',
                  'passport_series', 'passport_number', 'passport_issued_by',
                  'passport_issued_date', 'discount_pct'):
            if f in body and body[f] is not None:
                fields.append(f"{f}=%s"); values.append(body[f])
        if fields:
            values.append(client_id)
            cur.execute(f"UPDATE {SCHEMA}.clients SET {', '.join(fields)}, updated_at=NOW() WHERE id=%s", values)
            conn.commit()
        cur.close(); conn.close()
        return _ok({'ok': True})

    return _err(404, 'Не найдено')


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}

def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}