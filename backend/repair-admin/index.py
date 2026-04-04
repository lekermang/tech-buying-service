import json
import os
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
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
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (emp_token,)
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
            f"SELECT role FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (emp_token,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return row is not None and row[0] == 'owner'
    return False


def handler(event: dict, context) -> dict:
    """Управление заявками на ремонт: список, создание, смена статуса, дневная статистика"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': ALLOW_HEADERS},
            'body': '',
        }

    if not auth(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        action = params.get('action', '')

        # Дневная статистика
        if action == 'daily_stats':
            cur.execute(f"""
                SELECT
                    DATE(created_at AT TIME ZONE 'Europe/Moscow') as day,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'done') as done,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                    COALESCE(SUM(repair_amount) FILTER (WHERE status = 'done'), 0) as revenue,
                    COALESCE(SUM(purchase_amount) FILTER (WHERE status = 'done'), 0) as costs
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
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'stats': stats}, ensure_ascii=False)}

        # Список заявок
        status_filter = params.get('status', '')
        if status_filter:
            cur.execute(
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at, comment, purchase_amount, repair_amount, completed_at FROM {SCHEMA}.repair_orders WHERE status = %s ORDER BY created_at DESC",
                (status_filter,)
            )
        else:
            cur.execute(
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at, comment, purchase_amount, repair_amount, completed_at FROM {SCHEMA}.repair_orders ORDER BY created_at DESC LIMIT 200"
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
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    if method == 'POST':
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
        action = body.get('action', 'update_status')

        # Создание заявки
        if action == 'create':
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            model = (body.get('model') or '').strip() or None
            repair_type = (body.get('repair_type') or '').strip() or None
            price = body.get('price') or None
            comment = (body.get('comment') or '').strip() or None

            if not name or not phone:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите имя и телефон'}, ensure_ascii=False)}

            cur.execute(
                f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment, status) VALUES (%s, %s, %s, %s, %s, %s, 'new') RETURNING id",
                (name, phone, model, repair_type, int(price) if price else None, comment)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close(); conn.close()

            notify_telegram(new_id, name, phone, model, repair_type, price, comment)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'id': new_id}, ensure_ascii=False)}

        # Полное редактирование полей заявки
        if action == 'update_fields':
            order_id = body.get('id')
            if not order_id:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id'}, ensure_ascii=False)}
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            model = (body.get('model') or '').strip() or None
            repair_type = (body.get('repair_type') or '').strip() or None
            price = body.get('price')
            comment = (body.get('comment') or '').strip() or None
            admin_note = (body.get('admin_note') or '').strip() or None
            cur.execute(
                f"""UPDATE {SCHEMA}.repair_orders
                    SET name=%s, phone=%s, model=%s, repair_type=%s,
                        price=%s, comment=%s, admin_note=%s
                    WHERE id=%s RETURNING id""",
                (name, phone, model, repair_type,
                 int(price) if price else None, comment, admin_note, int(order_id))
            )
            updated = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()
            if not updated:
                return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Перевод в «Готово» с записью сумм (статус ready)
        if action == 'complete':
            order_id = body.get('id')
            purchase_amount = body.get('purchase_amount')
            repair_amount = body.get('repair_amount')

            if not order_id:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id заявки'}, ensure_ascii=False)}

            if not purchase_amount or not repair_amount:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите закупочную и итоговую цену'}, ensure_ascii=False)}

            cur.execute(
                f"""UPDATE {SCHEMA}.repair_orders
                    SET status = 'ready', purchase_amount = %s, repair_amount = %s,
                        status_updated_at = NOW()
                    WHERE id = %s RETURNING id""",
                (int(purchase_amount), int(repair_amount), int(order_id))
            )
            updated = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()

            if not updated:
                return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

            notify_client(int(order_id), 'ready', '')
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Смена статуса
        order_id = body.get('id')
        new_status = body.get('status', '').strip()
        admin_note = body.get('admin_note', '').strip()

        if not order_id or new_status not in VALID_STATUSES:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id и корректный статус'}, ensure_ascii=False)}

        cur.execute(
            f"UPDATE {SCHEMA}.repair_orders SET status = %s, admin_note = %s, status_updated_at = NOW() WHERE id = %s RETURNING id",
            (new_status, admin_note or None, int(order_id))
        )
        updated = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        if not updated:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        notify_client(int(order_id), new_status, admin_note)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Удаление заявки — только для владельца (admin token)
    if action == 'delete':
        if not is_owner(event):
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': HEADERS, 'body': json.dumps({'error': 'Только владелец может удалять заявки'}, ensure_ascii=False)}
        order_id = body.get('id')
        if not order_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id'}, ensure_ascii=False)}
        cur.execute(f"DELETE FROM {SCHEMA}.repair_orders WHERE id = %s RETURNING id", (int(order_id),))
        deleted = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        if not deleted:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    cur.close(); conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}


def notify_client(order_id: int, status: str, note: str):
    STATUS_LABELS = {
        'new': '📋 Заявка принята',
        'in_progress': '🔧 В работе',
        'waiting_parts': '📦 Ожидаем запчасть',
        'ready': '✅ Готово — можно забирать!',
        'done': '🏁 Выдано',
        'cancelled': '❌ Отменено',
    }
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    label = STATUS_LABELS.get(status, status)
    text = f"🔄 *Статус заявки #{order_id} обновлён*\n{label}" + (f"\n📝 {note}" if note else "")
    import requests
    requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
        timeout=10,
    )


def notify_telegram(order_id: int, name: str, phone: str, model, repair_type, price, comment):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    lines = [f"📋 *Новая заявка #{order_id}*"]
    lines.append(f"👤 {name} | 📞 {phone}")
    if model:
        lines.append(f"📱 {model}")
    if repair_type:
        lines.append(f"🔧 {repair_type}")
    if price:
        lines.append(f"💰 {int(price):,} ₽".replace(',', ' '))
    if comment:
        lines.append(f"💬 {comment}")
    import requests
    requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={'chat_id': chat_id, 'text': '\n'.join(lines), 'parse_mode': 'Markdown'},
        timeout=10,
    )