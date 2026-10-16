import json
import os
import re

import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Content-Type': 'application/json',
}
VALID = ('todo', 'progress', 'done')


def _resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def _q(v: str) -> str:
    return (v or '').replace("'", "''")


def handler(event: dict, context) -> dict:
    """План развития Staff: общие статусы задач (todo/progress/done) и журнал изменений. Только владелец и админ."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return _resp(401, {'error': 'Unauthorized'})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT role, full_name FROM {SCHEMA}.employees "
            f"WHERE auth_token='{_q(token)}' AND token_expires_at>NOW() AND is_active=true"
        )
        me = cur.fetchone()
        if not me:
            return _resp(401, {'error': 'Unauthorized'})
        if me[0] not in ('owner', 'admin'):
            return _resp(403, {'error': 'Нет доступа'})
        who = me[1] or me[0]

        if event.get('httpMethod') == 'GET':
            cur.execute(f"SELECT task_id, status, updated_by, updated_at FROM {SCHEMA}.growth_roadmap_status")
            statuses = {r[0]: {'status': r[1], 'by': r[2] or '', 'at': r[3].isoformat() if r[3] else None}
                        for r in cur.fetchall()}
            cur.execute(
                f"SELECT task_id, old_status, new_status, updated_by, created_at "
                f"FROM {SCHEMA}.growth_roadmap_log ORDER BY created_at DESC LIMIT 30"
            )
            log = [{'task_id': r[0], 'from': r[1], 'to': r[2], 'by': r[3] or '', 'at': r[4].isoformat()}
                   for r in cur.fetchall()]
            cur.execute(
                f"SELECT id, task_id, text, author, created_at FROM {SCHEMA}.growth_roadmap_notes "
                f"ORDER BY created_at DESC LIMIT 500"
            )
            notes = [{'id': r[0], 'task_id': r[1], 'text': r[2], 'by': r[3] or '', 'at': r[4].isoformat()}
                     for r in cur.fetchall()]
            return _resp(200, {'statuses': statuses, 'log': log, 'notes': notes, 'me': who})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'set')

        if action == 'note':
            task_id = str(body.get('task_id') or '')
            text = str(body.get('text') or '').strip()[:2000]
            if not re.fullmatch(r'[a-z0-9_]{1,20}', task_id) or not text:
                return _resp(400, {'error': 'Пустая заметка'})
            cur.execute(
                f"INSERT INTO {SCHEMA}.growth_roadmap_notes (task_id, text, author) "
                f"VALUES ('{task_id}', '{_q(text)}', '{_q(who)}') RETURNING id, created_at"
            )
            r = cur.fetchone()
            conn.commit()
            return _resp(200, {'ok': True, 'note': {'id': r[0], 'task_id': task_id, 'text': text, 'by': who, 'at': r[1].isoformat()}})

        if action == 'reset':
            if me[0] != 'owner':
                return _resp(403, {'error': 'Сбросить план может только владелец'})
            cur.execute(f"DELETE FROM {SCHEMA}.growth_roadmap_status")
            cur.execute(
                f"INSERT INTO {SCHEMA}.growth_roadmap_log (task_id, old_status, new_status, updated_by) "
                f"VALUES ('*', NULL, 'reset', '{_q(who)}')"
            )
            conn.commit()
            return _resp(200, {'ok': True})

        task_id = str(body.get('task_id') or '')
        status = str(body.get('status') or '')
        if not re.fullmatch(r'[a-z0-9_]{1,20}', task_id) or status not in VALID:
            return _resp(400, {'error': 'Неверные данные'})

        cur.execute(f"SELECT status FROM {SCHEMA}.growth_roadmap_status WHERE task_id='{task_id}'")
        prev = cur.fetchone()
        old = prev[0] if prev else 'todo'
        cur.execute(
            f"INSERT INTO {SCHEMA}.growth_roadmap_status (task_id, status, updated_by, updated_at) "
            f"VALUES ('{task_id}', '{status}', '{_q(who)}', NOW()) "
            f"ON CONFLICT (task_id) DO UPDATE SET status=EXCLUDED.status, updated_by=EXCLUDED.updated_by, updated_at=NOW()"
        )
        if old != status:
            cur.execute(
                f"INSERT INTO {SCHEMA}.growth_roadmap_log (task_id, old_status, new_status, updated_by) "
                f"VALUES ('{task_id}', '{old}', '{status}', '{_q(who)}')"
            )
        conn.commit()
        return _resp(200, {'ok': True, 'by': who})
    finally:
        cur.close()
        conn.close()
