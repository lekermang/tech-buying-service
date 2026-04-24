import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _auth_employee(conn, token: str):
    if not token:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "SELECT id, full_name, role, theme_settings FROM employees "
        "WHERE auth_token = %s AND is_active = true "
        "AND (token_expires_at IS NULL OR token_expires_at > now())",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    return row


def handler(event: dict, context) -> dict:
    """Персональные настройки темы сотрудника (аниме-персонаж, эффекты, цвета)."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'DATABASE_URL not configured'})

    conn = psycopg2.connect(dsn)
    try:
        emp = _auth_employee(conn, token)
        if not emp:
            return _resp(401, {'error': 'Unauthorized'})

        if method == 'GET':
            return _resp(200, {'settings': emp['theme_settings'] or {}})

        if method == 'POST':
            raw = event.get('body') or '{}'
            try:
                body = json.loads(raw) if isinstance(raw, str) else raw
            except json.JSONDecodeError:
                return _resp(400, {'error': 'Invalid JSON'})

            settings = body.get('settings')
            if not isinstance(settings, dict):
                return _resp(400, {'error': 'settings must be object'})

            allowed_keys = {
                'character_id', 'cursor_effect', 'accent_color',
                'bg_style', 'ui_density', 'font_family', 'enabled',
            }
            clean = {k: v for k, v in settings.items() if k in allowed_keys}

            cur = conn.cursor()
            cur.execute(
                "UPDATE employees SET theme_settings = %s::jsonb WHERE id = %s",
                (json.dumps(clean, ensure_ascii=False), emp['id']),
            )
            conn.commit()
            cur.close()
            return _resp(200, {'ok': True, 'settings': clean})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        conn.close()
