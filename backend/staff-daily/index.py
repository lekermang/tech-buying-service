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


# ---------- детали по конкретной задаче чек-листа ----------

def task_detail(cur, task_key: str) -> dict:
    """Возвращает интерактивные данные для конкретной задачи чек-листа."""

    # === REPAIR (Давид) ===
    if task_key == 'r1':  # Висяки >2 дней
        cur.execute(
            f"""SELECT id, name, model, status, phone,
                       COALESCE(purchase_amount,0)+COALESCE(advance,0) AS frozen,
                       COALESCE(status_updated_at, created_at) AS since,
                       EXTRACT(EPOCH FROM (NOW() - COALESCE(status_updated_at, created_at)))/86400 AS days
                FROM {SCHEMA}.repair_orders
                WHERE status IN ('in_progress','waiting_parts','ready','new')
                  AND COALESCE(status_updated_at, created_at) < NOW() - INTERVAL '2 days'
                ORDER BY since ASC LIMIT 30"""
        )
        items = []
        for r in cur.fetchall():
            items.append({
                'id': r[0], 'name': r[1], 'model': r[2], 'status': r[3],
                'phone': r[4], 'frozen': int(r[5] or 0),
                'days': round(float(r[7] or 0), 1),
            })
        return {'kind': 'repair_stuck', 'items': items, 'count': len(items)}

    if task_key == 'r2':  # Звонки клиентам по висякам
        cur.execute(
            f"""SELECT id, name, model, phone, status,
                       EXTRACT(EPOCH FROM (NOW() - COALESCE(status_updated_at, created_at)))/86400 AS days
                FROM {SCHEMA}.repair_orders
                WHERE status IN ('in_progress','waiting_parts','ready','new')
                  AND COALESCE(status_updated_at, created_at) < NOW() - INTERVAL '2 days'
                  AND phone IS NOT NULL AND phone <> ''
                ORDER BY days DESC LIMIT 30"""
        )
        items = [{
            'id': r[0], 'name': r[1], 'model': r[2], 'phone': r[3],
            'status': r[4], 'days': round(float(r[5] or 0), 1),
        } for r in cur.fetchall()]
        return {'kind': 'repair_calls', 'items': items, 'count': len(items)}

    if task_key == 'r3':  # Готов к выдаче
        cur.execute(
            f"""SELECT id, name, model, phone, COALESCE(repair_amount,0)
                FROM {SCHEMA}.repair_orders
                WHERE status='ready'
                ORDER BY status_updated_at ASC LIMIT 30"""
        )
        items = [{
            'id': r[0], 'name': r[1], 'model': r[2], 'phone': r[3], 'amount': int(r[4] or 0),
        } for r in cur.fetchall()]
        return {'kind': 'repair_ready', 'items': items, 'count': len(items)}

    if task_key in ('r4', 'r5'):
        cur.execute(
            f"""SELECT id, name, model, status
                FROM {SCHEMA}.repair_orders
                WHERE status IN ('in_progress','waiting_parts','ready','new')
                ORDER BY COALESCE(status_updated_at, created_at) DESC LIMIT 30"""
        )
        items = [{'id': r[0], 'name': r[1], 'model': r[2], 'status': r[3]} for r in cur.fetchall()]
        return {'kind': 'repair_active', 'items': items, 'count': len(items)}

    # === SALES (Богдан) ===
    if task_key == 's1':  # Витрина vs Авито
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.slshop_items WHERE status='stock' AND quantity>0")
        showcase = int(cur.fetchone()[0] or 0)
        cur.execute(
            f"""SELECT COUNT(*) FROM {SCHEMA}.avito_products
                WHERE status='active' AND avito_status='active' AND is_visible=true"""
        )
        on_avito = int(cur.fetchone()[0] or 0)
        # Товары на складе, для которых нет совпадений по title в avito_products (грубый match)
        cur.execute(
            f"""SELECT s.id, s.title, s.brand, s.model, s.sell_price
                FROM {SCHEMA}.slshop_items s
                WHERE s.status='stock' AND s.quantity>0
                  AND NOT EXISTS (
                    SELECT 1 FROM {SCHEMA}.avito_products a
                    WHERE a.status='active'
                      AND (a.title ILIKE '%' || COALESCE(s.model, s.title) || '%'
                           OR a.title ILIKE '%' || s.title || '%')
                  )
                ORDER BY s.created_at DESC LIMIT 30"""
        )
        missing = [{
            'id': r[0], 'title': r[1], 'brand': r[2], 'model': r[3], 'price': int(r[4] or 0),
        } for r in cur.fetchall()]
        # Авито без склада (товар на Авито, но не на витрине)
        cur.execute(
            f"""SELECT a.id, a.avito_id, a.title, a.price, a.url
                FROM {SCHEMA}.avito_products a
                WHERE a.status='active' AND a.avito_status='active'
                  AND NOT EXISTS (
                    SELECT 1 FROM {SCHEMA}.slshop_items s
                    WHERE s.status='stock' AND s.quantity>0
                      AND (a.title ILIKE '%' || COALESCE(s.model, s.title) || '%'
                           OR a.title ILIKE '%' || s.title || '%')
                  )
                ORDER BY a.avito_updated_at DESC LIMIT 30"""
        )
        orphan = [{
            'id': r[0], 'avito_id': r[1], 'title': r[2], 'price': int(r[3] or 0), 'url': r[4],
        } for r in cur.fetchall()]
        # Последняя синхронизация
        cur.execute(
            f"""SELECT finished_at, status, items_total, items_added, items_updated
                FROM {SCHEMA}.avito_sync_log
                ORDER BY id DESC LIMIT 1"""
        )
        last_sync = cur.fetchone()
        return {
            'kind': 'avito_sync',
            'showcase_count': showcase,
            'on_avito_count': on_avito,
            'avito_index': round(on_avito / showcase, 3) if showcase else 0,
            'missing_on_avito': missing,
            'missing_count': len(missing),
            'orphan_on_avito': orphan,
            'orphan_count': len(orphan),
            'last_sync_at': last_sync[0].isoformat() if last_sync and last_sync[0] else None,
            'last_sync_status': last_sync[1] if last_sync else None,
            'last_sync_items': int(last_sync[2] or 0) if last_sync else 0,
        }

    if task_key == 's2':  # Объявления >3 дней
        cur.execute(
            f"""SELECT id, avito_id, title, price, avito_updated_at, url,
                       EXTRACT(EPOCH FROM (NOW() - COALESCE(avito_updated_at, synced_at)))/86400 AS days
                FROM {SCHEMA}.avito_products
                WHERE status='active'
                  AND (avito_updated_at IS NULL OR avito_updated_at < NOW() - INTERVAL '3 days')
                ORDER BY avito_updated_at NULLS FIRST LIMIT 30"""
        )
        items = [{
            'id': r[0], 'avito_id': r[1], 'title': r[2], 'price': int(r[3] or 0),
            'updated': r[4].isoformat() if r[4] else None, 'url': r[5],
            'days': round(float(r[6] or 0), 1),
        } for r in cur.fetchall()]
        return {'kind': 'avito_stale', 'items': items, 'count': len(items)}

    if task_key == 's3':  # Проверка цен
        cur.execute(
            f"""SELECT id, avito_id, title, price, url
                FROM {SCHEMA}.avito_products
                WHERE status='active' AND avito_status='active'
                ORDER BY price DESC LIMIT 30"""
        )
        items = [{
            'id': r[0], 'avito_id': r[1], 'title': r[2], 'price': int(r[3] or 0), 'url': r[4],
        } for r in cur.fetchall()]
        return {'kind': 'avito_prices', 'items': items, 'count': len(items)}

    if task_key == 's4':  # Скупки сегодня
        cur.execute(
            f"""SELECT id, title, brand, model, COALESCE(buy_price,0)
                FROM {SCHEMA}.slshop_items
                WHERE buy_at::date=CURRENT_DATE
                ORDER BY buy_at DESC LIMIT 30"""
        )
        buyouts = [{
            'id': r[0], 'title': r[1], 'brand': r[2], 'model': r[3], 'buy_price': int(r[4] or 0),
        } for r in cur.fetchall()]
        cur.execute(
            f"""SELECT id, COALESCE(metal,'') AS metal, COALESCE(weight,0) AS w, COALESCE(total_amount,0)
                FROM {SCHEMA}.gold_orders
                WHERE created_at::date=CURRENT_DATE
                ORDER BY created_at DESC LIMIT 30"""
        )
        gold = [{
            'id': r[0], 'metal': r[1], 'weight': float(r[2] or 0), 'amount': int(r[3] or 0),
        } for r in cur.fetchall()]
        return {
            'kind': 'today_buyouts',
            'buyouts': buyouts, 'gold': gold,
            'buyouts_count': len(buyouts), 'gold_count': len(gold),
        }

    if task_key == 's5':  # Без фото / описания
        cur.execute(
            f"""SELECT id, title, brand, model,
                       (description IS NULL OR description='') AS no_desc,
                       (images IS NULL OR images='{{}}') AS no_img
                FROM {SCHEMA}.slshop_items
                WHERE status='stock' AND quantity>0
                  AND ((description IS NULL OR description='') OR images='{{}}' OR images IS NULL)
                ORDER BY created_at DESC LIMIT 30"""
        )
        items = [{
            'id': r[0], 'title': r[1], 'brand': r[2], 'model': r[3],
            'no_desc': bool(r[4]), 'no_img': bool(r[5]),
        } for r in cur.fetchall()]
        return {'kind': 'items_incomplete', 'items': items, 'count': len(items)}

    # === OWNER ===
    if task_key == 'o1':  # Отчёты Давида и Богдана
        today_d = date.today()
        result = {}
        for who_login, who_role in [(LOGIN_REPAIR, 'repair'), (LOGIN_SALES, 'sales')]:
            cur.execute(
                f"""SELECT e.id, e.full_name, e.login,
                          (SELECT COUNT(*) FROM {SCHEMA}.staff_daily_tasks t
                             WHERE t.employee_id=e.id AND t.task_date=%s AND t.is_done) AS done
                   FROM {SCHEMA}.employees e WHERE e.login=%s LIMIT 1""",
                (today_d, who_login),
            )
            row = cur.fetchone()
            if row:
                total = len(CHECKLISTS.get(who_role, []))
                result[who_role] = {
                    'id': row[0], 'full_name': row[1], 'login': row[2],
                    'done': int(row[3] or 0), 'total': total,
                }
        return {'kind': 'owner_reports', **result}

    if task_key == 'o2':  # Авито-индекс
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.slshop_items WHERE status='stock' AND quantity>0")
        showcase = int(cur.fetchone()[0] or 0)
        cur.execute(
            f"""SELECT COUNT(*) FROM {SCHEMA}.avito_products
                WHERE status='active' AND avito_status='active' AND is_visible=true"""
        )
        on_avito = int(cur.fetchone()[0] or 0)
        idx = round(on_avito / showcase, 3) if showcase else 0
        return {
            'kind': 'avito_index',
            'showcase_count': showcase, 'on_avito_count': on_avito,
            'avito_index': idx, 'is_ok': idx >= 0.7,
            'gap': max(0, showcase - on_avito),
        }

    if task_key == 'o3':  # Мёртвые деньги
        cur.execute(
            f"""SELECT id, name, model,
                       COALESCE(purchase_amount,0)+COALESCE(advance,0) AS frozen,
                       EXTRACT(EPOCH FROM (NOW() - COALESCE(status_updated_at, created_at)))/86400 AS days
                FROM {SCHEMA}.repair_orders
                WHERE status IN ('in_progress','waiting_parts','ready','new')
                  AND COALESCE(status_updated_at, created_at) < NOW() - INTERVAL '2 days'
                ORDER BY frozen DESC LIMIT 30"""
        )
        items = []
        total = 0
        for r in cur.fetchall():
            f = int(r[3] or 0)
            total += f
            items.append({
                'id': r[0], 'name': r[1], 'model': r[2], 'frozen': f,
                'days': round(float(r[4] or 0), 1),
            })
        cur.execute(
            f"SELECT phone FROM {SCHEMA}.employees WHERE login=%s LIMIT 1",
            (LOGIN_REPAIR,),
        )
        david = cur.fetchone()
        return {
            'kind': 'dead_money',
            'total': total, 'is_critical': total >= 50000,
            'items': items, 'count': len(items),
            'david_phone': david[0] if david else None,
        }

    if task_key == 'o4':  # Кто не закрыл задачи
        today_d = date.today()
        result = []
        for login, who_role in [(LOGIN_REPAIR, 'repair'), (LOGIN_SALES, 'sales')]:
            cur.execute(
                f"""SELECT e.id, e.full_name, e.login, e.phone
                    FROM {SCHEMA}.employees e WHERE e.login=%s AND e.is_active=true LIMIT 1""",
                (login,),
            )
            emp_row = cur.fetchone()
            if not emp_row:
                continue
            checklist = CHECKLISTS.get(who_role, [])
            keys = [t['key'] for t in checklist]
            placeholders = "ARRAY[" + ",".join(f"'{k}'" for k in keys) + "]"
            cur.execute(
                f"""SELECT task_key FROM {SCHEMA}.staff_daily_tasks
                    WHERE employee_id=%s AND task_date=%s AND is_done=true
                      AND task_key=ANY({placeholders})""",
                (emp_row[0], today_d),
            )
            done_keys = {r[0] for r in cur.fetchall()}
            pending = [t for t in checklist if t['key'] not in done_keys]
            result.append({
                'employee_id': emp_row[0],
                'full_name': emp_row[1],
                'login': emp_row[2],
                'phone': emp_row[3],
                'role': who_role,
                'pending': pending,
                'done': len(done_keys),
                'total': len(checklist),
            })
        return {'kind': 'team_pending', 'team': result}

    if task_key == 'o5':  # Стратегическая задача
        return {'kind': 'strategic', 'note': ''}

    return {'kind': 'unknown'}


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

    if method == 'GET' and action == 'task-detail':
        task_key = (params.get('task_key') or '').strip()
        if not task_key:
            return _err(400, 'task_key обязателен')
        valid_keys = {t['key'] for arr in CHECKLISTS.values() for t in arr}
        if task_key not in valid_keys:
            return _err(400, 'Неизвестный task_key')
        conn = get_conn()
        cur = conn.cursor()
        try:
            data = task_detail(cur, task_key)
        finally:
            cur.close()
            conn.close()
        return _ok({'task_key': task_key, 'detail': data})

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