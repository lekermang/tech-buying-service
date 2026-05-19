import json
import os
from datetime import date
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

# Сопоставление логинов с ролевой картой («Мой день»)
LOGIN_REPAIR = 'PluXan'   # Давид
LOGIN_SALES = 'Bogdan'    # Богдан

# Чек-листы (статические)
CHECKLISTS = {
    'repair': [
        {'key': 'r1', 'label': 'Просмотреть все ремонты, которые висят >2 дней'},
        {'key': 'r2', 'label': 'По каждому висяку — позвонить клиенту, согласовать решение'},
        {'key': 'r3', 'label': 'Закрыть все ремонты со статусом «Готов» (выдать клиенту)'},
        {'key': 'r4', 'label': 'Не брать новый ремонт, пока висяк не закрыт'},
        {'key': 'r5', 'label': 'Отметить выполненные ремонты в системе (статус «Готов»/«Выдан»)'},
    ],
    'sales': [
        {'key': 's1', 'label': 'Сверить витрину vs Авито — добавить недостающие до 16:00'},
        {'key': 's2', 'label': 'Поднять объявления, которые не обновлялись >3 дней'},
        {'key': 's3', 'label': 'Проверить цены и состояние товаров на Авито'},
        {'key': 's4', 'label': 'Внести новые скупки в систему (товары и золото)'},
        {'key': 's5', 'label': 'Сделать фото и описания для новых поступлений'},
    ],
    'owner': [
        {'key': 'o1', 'label': 'Просмотреть отчёты Давида и Богдана до 18:30'},
        {'key': 'o2', 'label': 'Авито-индекс <0.7 → выдать задачу на подъём всех товаров'},
        {'key': 'o3', 'label': 'Мёртвые деньги >50 000 ₽ → личный звонок Давиду'},
        {'key': 'o4', 'label': 'Проверить, кто не закрыл задачи к концу дня'},
        {'key': 'o5', 'label': 'Утвердить одну стратегическую задачу на рост'},
    ],
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, full_name, login, role FROM {SCHEMA}.employees "
        f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]} if row else None


def role_for_employee(emp: dict) -> str:
    """Определяет, какой кабинет показать сотруднику."""
    if emp.get('role') == 'owner':
        return 'owner'
    login = (emp.get('login') or '').strip()
    if login == LOGIN_REPAIR:
        return 'repair'
    if login == LOGIN_SALES:
        return 'sales'
    # По умолчанию админу показываем кабинет владельца, остальным — продажи
    return 'owner' if emp.get('role') == 'admin' else 'sales'


# ---------- сигналы ----------

def signals_repair(cur):
    """Ремонты, которые висят >2 дней (мёртвые деньги Давида)."""
    cur.execute(
        f"""SELECT id, name, model, status,
                   COALESCE(purchase_amount, 0) AS parts,
                   COALESCE(advance, 0) AS advance,
                   COALESCE(repair_amount, 0) AS amount,
                   COALESCE(status_updated_at, created_at) AS since,
                   EXTRACT(EPOCH FROM (NOW() - COALESCE(status_updated_at, created_at)))/86400 AS days
            FROM {SCHEMA}.repair_orders
            WHERE status IN ('in_progress','waiting_parts','ready','new')
              AND COALESCE(status_updated_at, created_at) < NOW() - INTERVAL '2 days'
            ORDER BY since ASC
            LIMIT 20"""
    )
    items = []
    dead_money = 0
    for r in cur.fetchall():
        parts = int(r[4] or 0)
        adv = int(r[5] or 0)
        frozen = parts + adv
        dead_money += frozen
        items.append({
            'id': r[0],
            'name': r[1],
            'model': r[2],
            'status': r[3],
            'frozen': frozen,
            'parts_cost': parts,
            'advance': adv,
            'repair_amount': int(r[6] or 0),
            'since': r[7].isoformat() if r[7] else None,
            'days': round(float(r[8] or 0), 1),
        })
    # Готовые к выдаче (status='ready')
    cur.execute(
        f"""SELECT id, name, model, COALESCE(repair_amount,0)
            FROM {SCHEMA}.repair_orders
            WHERE status='ready'
            ORDER BY status_updated_at ASC LIMIT 20"""
    )
    ready = [{'id': r[0], 'name': r[1], 'model': r[2], 'amount': int(r[3] or 0)} for r in cur.fetchall()]
    return {
        'stuck_orders': items,
        'dead_money': dead_money,
        'ready_to_hand_off': ready,
        'count_stuck': len(items),
    }


def signals_sales(cur):
    """Авито-индекс и товары без активных объявлений."""
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.slshop_items WHERE status='stock' AND quantity>0"
    )
    showcase = int(cur.fetchone()[0] or 0)

    cur.execute(
        f"""SELECT COUNT(*) FROM {SCHEMA}.avito_products
            WHERE status='active' AND avito_status='active' AND is_visible=true"""
    )
    on_avito = int(cur.fetchone()[0] or 0)

    avito_index = round(on_avito / showcase, 3) if showcase else 0

    # Объявления, не обновлявшиеся >3 дней
    cur.execute(
        f"""SELECT id, title, price, avito_updated_at
            FROM {SCHEMA}.avito_products
            WHERE status='active'
              AND (avito_updated_at IS NULL OR avito_updated_at < NOW() - INTERVAL '3 days')
            ORDER BY avito_updated_at NULLS FIRST
            LIMIT 15"""
    )
    stale = [{
        'id': r[0],
        'title': r[1],
        'price': int(r[2] or 0),
        'updated': r[3].isoformat() if r[3] else None,
    } for r in cur.fetchall()]

    # Б/У товары без описания / без фото
    cur.execute(
        f"""SELECT COUNT(*) FROM {SCHEMA}.slshop_items
            WHERE status='stock' AND quantity>0
              AND (description IS NULL OR description='' OR images='{{}}' OR images IS NULL)"""
    )
    incomplete = int(cur.fetchone()[0] or 0)

    # Сегодняшние скупки (б/у + золото)
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.slshop_items WHERE buy_at::date=CURRENT_DATE"
    )
    today_buy = int(cur.fetchone()[0] or 0)

    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.gold_orders WHERE created_at::date=CURRENT_DATE"
    )
    today_gold = int(cur.fetchone()[0] or 0)

    return {
        'showcase_count': showcase,
        'on_avito_count': on_avito,
        'avito_index': avito_index,
        'avito_index_ok': avito_index >= 0.7,
        'stale_avito': stale,
        'stale_avito_count': len(stale),
        'incomplete_items_count': incomplete,
        'today_buyouts': today_buy,
        'today_gold': today_gold,
    }


def progress_for(cur, employee_id: int, role: str, today: date):
    """Сколько задач выполнено из чек-листа за сегодня."""
    checklist = CHECKLISTS.get(role, [])
    if not checklist:
        return {'done': 0, 'total': 0, 'tasks': []}
    keys = [t['key'] for t in checklist]
    placeholders = "ARRAY[" + ",".join(f"'{k}'" for k in keys) + "]"
    cur.execute(
        f"""SELECT task_key, is_done, note, completed_at
            FROM {SCHEMA}.staff_daily_tasks
            WHERE employee_id=%s AND task_date=%s
              AND task_key = ANY({placeholders})""",
        (employee_id, today),
    )
    state = {r[0]: {
        'is_done': bool(r[1]),
        'note': r[2],
        'completed_at': r[3].isoformat() if r[3] else None,
    } for r in cur.fetchall()}

    tasks = []
    done_n = 0
    for t in checklist:
        s = state.get(t['key'], {'is_done': False, 'note': None, 'completed_at': None})
        if s['is_done']:
            done_n += 1
        tasks.append({**t, **s})
    return {'done': done_n, 'total': len(checklist), 'tasks': tasks}


# ---------- handler ----------

def _err(code, msg):
    return {
        'statusCode': code,
        'headers': {**HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': msg}, ensure_ascii=False),
    }


def _ok(data):
    return {
        'statusCode': 200,
        'headers': {**HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(data, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    """Ежедневные сигналы и чек-листы для команды (Давид/Богдан/Владелец)."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                **HEADERS,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    emp = get_employee(emp_token)
    if not emp:
        return _err(401, 'Требуется авторизация сотрудника')

    role = role_for_employee(emp)
    action = params.get('action', 'my-day')
    today = date.today()

    if method == 'GET' and action == 'my-day':
        conn = get_conn()
        cur = conn.cursor()

        view = params.get('role') or role
        if view not in ('repair', 'sales', 'owner'):
            view = role
        # Только владелец может смотреть кабинеты других ролей
        if view != role and emp.get('role') != 'owner':
            view = role

        result = {
            'employee': emp,
            'role': view,
            'today': today.isoformat(),
            'checklist': progress_for(cur, emp['id'], view, today),
        }

        if view == 'repair':
            result['signals'] = signals_repair(cur)
        elif view == 'sales':
            result['signals'] = signals_sales(cur)
        else:
            # Владельцу — обе сводки + прогресс команды
            result['signals'] = {
                'repair': signals_repair(cur),
                'sales': signals_sales(cur),
            }
            cur.execute(
                f"""SELECT e.id, e.full_name, e.login,
                          COUNT(t.id) FILTER (WHERE t.is_done) AS done,
                          COUNT(t.id) AS total
                   FROM {SCHEMA}.employees e
                   LEFT JOIN {SCHEMA}.staff_daily_tasks t
                          ON t.employee_id=e.id AND t.task_date=%s
                   WHERE e.is_active=true
                   GROUP BY e.id, e.full_name, e.login
                   ORDER BY e.id""",
                (today,),
            )
            team = []
            for r in cur.fetchall():
                login = r[2] or ''
                if login == LOGIN_REPAIR:
                    r_role = 'repair'
                elif login == LOGIN_SALES:
                    r_role = 'sales'
                else:
                    r_role = 'owner'
                total_for_role = len(CHECKLISTS.get(r_role, []))
                team.append({
                    'id': r[0],
                    'full_name': r[1],
                    'login': login,
                    'role': r_role,
                    'done': int(r[3] or 0),
                    'total': total_for_role,
                })
            result['team'] = team
        cur.close()
        conn.close()
        return _ok(result)

    if method == 'POST' and action == 'toggle':
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
        task_key = (body.get('task_key') or '').strip()
        is_done = bool(body.get('is_done'))
        note = body.get('note')
        if not task_key:
            return _err(400, 'task_key обязателен')

        valid_keys = {t['key'] for arr in CHECKLISTS.values() for t in arr}
        if task_key not in valid_keys:
            return _err(400, 'Неизвестный task_key')

        conn = get_conn()
        cur = conn.cursor()
        # safe escape для note
        note_safe = (note or '').replace("'", "''") if note else None
        cur.execute(
            f"""INSERT INTO {SCHEMA}.staff_daily_tasks
                  (employee_id, task_date, task_key, is_done, note, completed_at)
                VALUES (%s, %s, %s, %s, %s, CASE WHEN %s THEN NOW() ELSE NULL END)
                ON CONFLICT (employee_id, task_date, task_key)
                DO UPDATE SET
                  is_done = EXCLUDED.is_done,
                  note = COALESCE(EXCLUDED.note, {SCHEMA}.staff_daily_tasks.note),
                  completed_at = CASE WHEN EXCLUDED.is_done THEN NOW() ELSE NULL END
                RETURNING is_done, completed_at""",
            (emp['id'], today, task_key, is_done, note_safe, is_done),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return _ok({'ok': True, 'is_done': bool(row[0]), 'completed_at': row[1].isoformat() if row[1] else None})

    return _err(404, 'Неизвестный action')
