"""
want-to-buy — заявки «Хочу купить».
Клиент оставляет заявку — что ищет, бюджет, состояние.
Всё сохраняется в БД, уходит в MAX (общий чат сотрудников) и Telegram.

GET  ?action=list          — список заявок (staff only)
GET  ?action=stats         — счётчики по статусам (staff only)
POST ?action=create        — создать заявку (публичный)
POST ?action=update_status — сменить статус заявки (staff only)
POST ?action=add_note      — добавить заметку сотрудника (staff only)
"""

import json
import os
import psycopg2
import requests

SCHEMA = 't_p31606708_tech_buying_service'
MAX_BOT_URL = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
    'Content-Type': 'application/json',
}

VALID_STATUSES = ['new', 'in_work', 'found', 'closed', 'cancelled']
STATUS_LABELS = {
    'new': '🆕 Новая',
    'in_work': '🔍 Ищем',
    'found': '✅ Нашли',
    'closed': '🤝 Продано',
    'cancelled': '❌ Отменена',
}

CONDITION_LABELS = {
    'new': 'Новое',
    'like_new': 'Как новое',
    'good': 'Хорошее',
    'any': 'Любое',
}


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _ok(data: dict, status: int = 200) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def _err(status: int, msg: str) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'ok': False, 'error': msg}, ensure_ascii=False)}


def _auth_staff(event: dict) -> bool:
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = hdrs.get('x-employee-token', '')
    admin_token = hdrs.get('x-admin-token', '')
    if admin_token == os.environ.get('ADMIN_TOKEN', 'Mark2015N'):
        return True
    if not emp_token:
        return False
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.employees WHERE auth_token='{emp_token}' AND token_expires_at>NOW() AND is_active=true LIMIT 1"
    )
    row = cur.fetchone(); cur.close(); conn.close()
    return row is not None


def _notify_max(item_id: int, name: str, phone: str, item_name: str, category: str,
                budget: str, condition: str, comment: str):
    """Отправляем уведомление в MAX-канал сотрудников."""
    cond_label = CONDITION_LABELS.get(condition, condition or 'Любое')
    text = (
        f"🛒 *Хочу купить #{item_id}*\n\n"
        f"👤 {name}\n"
        f"📞 {phone}\n"
        f"📦 *Что ищет:* {item_name}\n"
        + (f"🏷 *Категория:* {category}\n" if category else "")
        + (f"💰 *Бюджет:* {budget}\n" if budget else "")
        + f"✨ *Состояние:* {cond_label}\n"
        + (f"📝 {comment[:300]}\n" if comment else "")
        + f"\n_Проверь наличие в каталоге и свяжись с клиентом!_"
    )
    try:
        requests.post(
            f'{MAX_BOT_URL}?action=staff_send',
            json={'text': text},
            timeout=8,
        )
    except Exception as e:
        print(f'[want-to-buy][MAX] error: {e}')


def _notify_telegram(item_id: int, name: str, phone: str, item_name: str,
                     category: str, budget: str, condition: str, comment: str):
    """Дублируем в Telegram-группу сотрудников."""
    tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    tg_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not tg_token or not tg_chat:
        return
    cond_label = CONDITION_LABELS.get(condition, condition or 'Любое')
    text = (
        f"🛒 *Хочу купить #{item_id} — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n📞 *Телефон:* {phone}\n"
        f"📦 *Что ищет:* {item_name}\n"
        + (f"🏷 *Категория:* {category}\n" if category else "")
        + (f"💰 *Бюджет:* до {budget}\n" if budget else "")
        + f"✨ *Состояние:* {cond_label}"
        + (f"\n📝 {comment[:300]}" if comment else "")
    )
    try:
        requests.post(
            f'https://api.telegram.org/bot{tg_token}/sendMessage',
            json={'chat_id': tg_chat, 'text': text, 'parse_mode': 'Markdown'},
            timeout=8,
        )
    except Exception as e:
        print(f'[want-to-buy][TG] error: {e}')


def handler(event: dict, context) -> dict:
    """Обработчик заявок «Хочу купить»."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = (event.get('httpMethod') or 'GET').upper()
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # ── GET: список заявок ──────────────────────────────────────────────────
    if method == 'GET' and action == 'list':
        if not _auth_staff(event):
            return _err(401, 'Требуется авторизация')
        status_filter = params.get('status', '')
        search = (params.get('search') or '').strip()
        limit = min(int(params.get('limit', 100)), 500)
        conds = []
        if status_filter and status_filter in VALID_STATUSES:
            conds.append(f"status='{status_filter}'")
        if search:
            s = search.replace("'", "''")
            conds.append(f"(client_name ILIKE '%{s}%' OR client_phone ILIKE '%{s}%' OR item_name ILIKE '%{s}%')")
        where = ('WHERE ' + ' AND '.join(conds)) if conds else ''
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id, client_name, client_phone, item_name, category, budget, condition, comment, "
            f"status, staff_note, staff_name, found_at, created_at, updated_at "
            f"FROM {SCHEMA}.want_to_buy {where} ORDER BY created_at DESC LIMIT {limit}"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        items = [{
            'id': r[0], 'client_name': r[1], 'client_phone': r[2], 'item_name': r[3],
            'category': r[4], 'budget': r[5], 'condition': r[6], 'comment': r[7],
            'status': r[8], 'staff_note': r[9], 'staff_name': r[10],
            'found_at': r[11].isoformat() if r[11] else None,
            'created_at': r[12].isoformat() if r[12] else None,
            'updated_at': r[13].isoformat() if r[13] else None,
            'status_label': STATUS_LABELS.get(r[8], r[8]),
        } for r in rows]
        return _ok({'ok': True, 'items': items, 'total': len(items)})

    # ── GET: статистика ────────────────────────────────────────────────────
    if method == 'GET' and action == 'stats':
        if not _auth_staff(event):
            return _err(401, 'Требуется авторизация')
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT status, COUNT(*) FROM {SCHEMA}.want_to_buy GROUP BY status"
        )
        rows = cur.fetchall(); cur.close(); conn.close()
        counts = {r[0]: r[1] for r in rows}
        return _ok({'ok': True, 'counts': counts,
                    'total': sum(counts.values()),
                    'new': counts.get('new', 0)})

    # ── POST: создать заявку (публичный) ───────────────────────────────────
    if method == 'POST':
        raw = event.get('body') or '{}'
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
        act = body.get('action', action or 'create')

        if act == 'create':
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            item_name = (body.get('item_name') or '').strip()
            if not name or not phone or not item_name:
                return _err(400, 'Имя, телефон и наименование обязательны')

            category = (body.get('category') or '').strip()
            budget = (body.get('budget') or '').strip()
            condition = (body.get('condition') or 'any').strip()
            comment = (body.get('comment') or '').strip()

            def esc(v): return str(v).replace("'", "''")
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.want_to_buy "
                f"(client_name, client_phone, item_name, category, budget, condition, comment) "
                f"VALUES ('{esc(name)}', '{esc(phone)}', '{esc(item_name)}', "
                f"'{esc(category)}', '{esc(budget)}', '{esc(condition)}', '{esc(comment)}') "
                f"RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()

            _notify_max(new_id, name, phone, item_name, category, budget, condition, comment)
            _notify_telegram(new_id, name, phone, item_name, category, budget, condition, comment)

            return _ok({'ok': True, 'id': new_id})

        # ── POST: сменить статус (staff) ───────────────────────────────────
        if act == 'update_status':
            if not _auth_staff(event):
                return _err(401, 'Требуется авторизация')
            item_id = int(body.get('id', 0))
            new_status = (body.get('status') or '').strip()
            staff_name = (body.get('staff_name') or 'Сотрудник').strip()
            if not item_id or new_status not in VALID_STATUSES:
                return _err(400, 'id и статус обязательны')
            def esc(v): return str(v).replace("'", "''")
            found_sql = ", found_at=NOW()" if new_status == 'found' else ''
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.want_to_buy "
                f"SET status='{new_status}', staff_name='{esc(staff_name)}', updated_at=NOW(){found_sql} "
                f"WHERE id={item_id} RETURNING id, client_name, client_phone, item_name"
            )
            row = cur.fetchone()
            conn.commit(); cur.close(); conn.close()
            if not row:
                return _err(404, 'Заявка не найдена')
            if new_status == 'found':
                try:
                    requests.post(
                        f'{MAX_BOT_URL}?action=staff_send',
                        json={'text': f"✅ *Нашли товар для клиента!*\n\n👤 {row[1]}\n📞 {row[2]}\n📦 {row[3]}\n\n_{staff_name} отметил(а) как найдено — свяжитесь с клиентом!_"},
                        timeout=6,
                    )
                except Exception:
                    pass
            return _ok({'ok': True, 'status': new_status, 'status_label': STATUS_LABELS[new_status]})

        # ── POST: добавить заметку (staff) ─────────────────────────────────
        if act == 'add_note':
            if not _auth_staff(event):
                return _err(401, 'Требуется авторизация')
            item_id = int(body.get('id', 0))
            note = (body.get('note') or '').strip()
            staff_name = (body.get('staff_name') or 'Сотрудник').strip()
            if not item_id:
                return _err(400, 'id обязателен')
            def esc(v): return str(v).replace("'", "''")
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.want_to_buy "
                f"SET staff_note='{esc(note)}', staff_name='{esc(staff_name)}', updated_at=NOW() "
                f"WHERE id={item_id} RETURNING id"
            )
            conn.commit(); cur.close(); conn.close()
            return _ok({'ok': True})

        return _err(400, f'Неизвестный action: {act}')

    return _err(405, 'Method not allowed')
