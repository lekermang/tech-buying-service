import json
import os
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional

import psycopg2
import psycopg2.extras

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, Authorization',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def auth_employee(token: str):
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, login, role FROM {SCHEMA}.employees "
            f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (token,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]}
    finally:
        cur.close(); conn.close()


def _ok(data: Any, status: int = 200) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def _err(status: int, msg: str) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def row_to_dict(cur, row):
    if row is None:
        return None
    return {desc[0]: row[i] for i, desc in enumerate(cur.description)}


# ---------- Категории ----------

def list_categories():
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, name, slug, icon, color, sort_order FROM {SCHEMA}.sl_categories ORDER BY sort_order, id"
        )
        rows = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'items': rows})
    finally:
        cur.close(); conn.close()


def create_category(body: dict):
    name = (body.get('name') or '').strip()
    slug = (body.get('slug') or '').strip().lower()
    if not name or not slug:
        return _err(400, 'name и slug обязательны')
    icon = body.get('icon') or 'Package'
    color = body.get('color') or '#FFD700'
    sort_order = int(body.get('sort_order') or 100)
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_categories (name, slug, icon, color, sort_order) "
            f"VALUES (%s,%s,%s,%s,%s) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, "
            f"icon=EXCLUDED.icon, color=EXCLUDED.color, sort_order=EXCLUDED.sort_order RETURNING id",
            (name, slug, icon, color, sort_order),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return _ok({'id': new_id})
    finally:
        cur.close(); conn.close()


def update_category(body: dict):
    cid = body.get('id')
    if not cid:
        return _err(400, 'id обязателен')
    fields = []
    values = []
    for k in ('name', 'icon', 'color', 'sort_order'):
        if k in body:
            fields.append(f"{k}=%s")
            values.append(body[k])
    if not fields:
        return _err(400, 'нет полей для обновления')
    values.append(cid)
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.sl_categories SET {', '.join(fields)} WHERE id=%s", values)
        conn.commit()
        return _ok({'ok': True})
    finally:
        cur.close(); conn.close()


# ---------- Клиенты ----------

def list_clients(params: dict):
    q = (params.get('q') or '').strip()
    conn = get_conn(); cur = conn.cursor()
    try:
        if q:
            like = f"%{q}%"
            cur.execute(
                f"SELECT id, full_name, phone, passport_series, passport_number, notes, created_at "
                f"FROM {SCHEMA}.sl_clients WHERE full_name ILIKE %s OR phone ILIKE %s "
                f"ORDER BY id DESC LIMIT 100",
                (like, like),
            )
        else:
            cur.execute(
                f"SELECT id, full_name, phone, passport_series, passport_number, notes, created_at "
                f"FROM {SCHEMA}.sl_clients ORDER BY id DESC LIMIT 200"
            )
        rows = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'items': rows})
    finally:
        cur.close(); conn.close()


def get_client(params: dict):
    cid = params.get('id')
    if not cid:
        return _err(400, 'id обязателен')
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, phone, passport_series, passport_number, passport_issued_by, "
            f"passport_issued_date, passport_address, birth_date, notes, created_at "
            f"FROM {SCHEMA}.sl_clients WHERE id=%s",
            (cid,),
        )
        row = row_to_dict(cur, cur.fetchone())
        if not row:
            return _err(404, 'Клиент не найден')
        # история операций
        cur.execute(
            f"SELECT o.id, o.op_type, o.amount, o.payment_method, o.created_at, "
            f"i.title FROM {SCHEMA}.sl_operations o "
            f"LEFT JOIN {SCHEMA}.sl_items i ON i.id=o.item_id "
            f"WHERE o.client_id=%s ORDER BY o.created_at DESC LIMIT 100",
            (cid,),
        )
        ops = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'client': row, 'operations': ops})
    finally:
        cur.close(); conn.close()


def upsert_client(body: dict):
    cid = body.get('id')
    full_name = (body.get('full_name') or '').strip()
    if not full_name:
        return _err(400, 'ФИО обязательно')
    phone = (body.get('phone') or '').strip() or None
    ps = body.get('passport_series') or None
    pn = body.get('passport_number') or None
    pib = body.get('passport_issued_by') or None
    pid = body.get('passport_issued_date') or None
    pa = body.get('passport_address') or None
    bd = body.get('birth_date') or None
    notes = body.get('notes') or None
    conn = get_conn(); cur = conn.cursor()
    try:
        if cid:
            cur.execute(
                f"UPDATE {SCHEMA}.sl_clients SET full_name=%s, phone=%s, passport_series=%s, "
                f"passport_number=%s, passport_issued_by=%s, passport_issued_date=%s, "
                f"passport_address=%s, birth_date=%s, notes=%s, updated_at=NOW() WHERE id=%s",
                (full_name, phone, ps, pn, pib, pid, pa, bd, notes, cid),
            )
            conn.commit()
            return _ok({'id': cid})
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_clients (full_name, phone, passport_series, passport_number, "
            f"passport_issued_by, passport_issued_date, passport_address, birth_date, notes) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (full_name, phone, ps, pn, pib, pid, pa, bd, notes),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return _ok({'id': new_id})
    finally:
        cur.close(); conn.close()


# ---------- Товары ----------

def list_items(params: dict):
    q = (params.get('q') or '').strip()
    status = (params.get('status') or '').strip()
    location = (params.get('location') or '').strip()
    cat = params.get('category_id')
    where = []
    values: list = []
    if q:
        where.append("(i.title ILIKE %s OR COALESCE(i.brand,'') ILIKE %s OR COALESCE(i.model,'') ILIKE %s OR COALESCE(i.imei,'') ILIKE %s)")
        like = f"%{q}%"
        values.extend([like, like, like, like])
    if status:
        where.append("i.status=%s"); values.append(status)
    if location:
        where.append("i.location=%s"); values.append(location)
    if cat:
        where.append("i.category_id=%s"); values.append(int(cat))
    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT i.id, i.title, i.brand, i.model, i.specs, i.condition, i.color, i.storage, i.imei, "
            f"i.purchase_price, i.sell_price, i.status, i.location, i.source, i.purchase_date, i.sell_date, "
            f"i.photos, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon, "
            f"i.category_id, i.purchase_employee, i.sell_employee, "
            f"cl1.full_name AS purchase_client_name, cl2.full_name AS sell_client_name "
            f"FROM {SCHEMA}.sl_items i "
            f"LEFT JOIN {SCHEMA}.sl_categories c ON c.id=i.category_id "
            f"LEFT JOIN {SCHEMA}.sl_clients cl1 ON cl1.id=i.purchase_client_id "
            f"LEFT JOIN {SCHEMA}.sl_clients cl2 ON cl2.id=i.sell_client_id "
            f"{where_sql} ORDER BY i.id DESC LIMIT 500",
            values,
        )
        rows = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'items': rows})
    finally:
        cur.close(); conn.close()


def get_item(params: dict):
    iid = params.get('id')
    if not iid:
        return _err(400, 'id обязателен')
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT i.*, c.name AS category_name, c.slug AS category_slug, "
            f"cl1.full_name AS purchase_client_name, cl1.phone AS purchase_client_phone, "
            f"cl2.full_name AS sell_client_name, cl2.phone AS sell_client_phone "
            f"FROM {SCHEMA}.sl_items i "
            f"LEFT JOIN {SCHEMA}.sl_categories c ON c.id=i.category_id "
            f"LEFT JOIN {SCHEMA}.sl_clients cl1 ON cl1.id=i.purchase_client_id "
            f"LEFT JOIN {SCHEMA}.sl_clients cl2 ON cl2.id=i.sell_client_id "
            f"WHERE i.id=%s",
            (iid,),
        )
        item = row_to_dict(cur, cur.fetchone())
        if not item:
            return _err(404, 'Товар не найден')
        cur.execute(
            f"SELECT id, op_type, amount, payment_method, contract_number, employee, notes, created_at "
            f"FROM {SCHEMA}.sl_operations WHERE item_id=%s ORDER BY created_at DESC",
            (iid,),
        )
        ops = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'item': item, 'operations': ops})
    finally:
        cur.close(); conn.close()


def buyout_item(body: dict, employee_name: str):
    """Скупка: создаёт товар + операцию buyout."""
    title = (body.get('title') or '').strip()
    if not title:
        return _err(400, 'Наименование обязательно')
    purchase_price = float(body.get('purchase_price') or 0)
    sell_price = float(body.get('sell_price') or 0)
    category_id = body.get('category_id')
    brand = body.get('brand'); model = body.get('model'); specs = body.get('specs')
    condition = body.get('condition') or 'хорошее'
    color = body.get('color'); storage = body.get('storage'); imei = body.get('imei')
    serial_number = body.get('serial_number'); description = body.get('description')
    photos = body.get('photos') or []
    source = body.get('source') or 'buyout'
    location = body.get('location') or 'showcase'
    payment_method = body.get('payment_method') or 'cash'
    contract_number = body.get('contract_number')

    # клиент: либо id, либо данные нового
    client_id = body.get('client_id')
    client_data = body.get('client') or {}
    conn = get_conn(); cur = conn.cursor()
    try:
        if not client_id and client_data.get('full_name'):
            cur.execute(
                f"INSERT INTO {SCHEMA}.sl_clients (full_name, phone, passport_series, passport_number, "
                f"passport_issued_by, passport_issued_date, passport_address, birth_date, notes) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (
                    client_data.get('full_name'), client_data.get('phone'),
                    client_data.get('passport_series'), client_data.get('passport_number'),
                    client_data.get('passport_issued_by'), client_data.get('passport_issued_date'),
                    client_data.get('passport_address'), client_data.get('birth_date'),
                    client_data.get('notes'),
                ),
            )
            client_id = cur.fetchone()[0]

        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_items (category_id, title, brand, model, specs, condition, color, "
            f"storage, imei, serial_number, description, photos, purchase_price, sell_price, status, "
            f"location, source, purchase_client_id, purchase_employee) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,'in_stock',%s,%s,%s,%s) RETURNING id",
            (
                category_id, title, brand, model, specs, condition, color, storage, imei,
                serial_number, description, json.dumps(photos), purchase_price, sell_price,
                location, source, client_id, employee_name,
            ),
        )
        item_id = cur.fetchone()[0]

        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_operations (item_id, client_id, op_type, amount, payment_method, "
            f"contract_number, employee) VALUES (%s,%s,'buyout',%s,%s,%s,%s)",
            (item_id, client_id, purchase_price, payment_method, contract_number, employee_name),
        )

        # сохраняем шаблон характеристик
        if specs and (brand or title):
            cur.execute(
                f"INSERT INTO {SCHEMA}.sl_specs_templates (category_id, brand, model, title_pattern, specs, use_count) "
                f"VALUES (%s,%s,%s,%s,%s,1)",
                (category_id, brand, model, title, specs),
            )

        conn.commit()
        return _ok({'id': item_id, 'client_id': client_id})
    finally:
        cur.close(); conn.close()


def update_item(body: dict):
    iid = body.get('id')
    if not iid:
        return _err(400, 'id обязателен')
    allowed = ['title', 'brand', 'model', 'specs', 'condition', 'color', 'storage', 'imei',
               'serial_number', 'description', 'sell_price', 'purchase_price', 'status', 'location',
               'category_id']
    fields = []; values: list = []
    for k in allowed:
        if k in body:
            fields.append(f"{k}=%s"); values.append(body[k])
    if 'photos' in body:
        fields.append("photos=%s::jsonb"); values.append(json.dumps(body['photos'] or []))
    if not fields:
        return _err(400, 'нет полей для обновления')
    fields.append("updated_at=NOW()")
    values.append(iid)
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.sl_items SET {', '.join(fields)} WHERE id=%s", values)
        conn.commit()
        return _ok({'ok': True})
    finally:
        cur.close(); conn.close()


def sell_item(body: dict, employee_name: str):
    iid = body.get('item_id')
    if not iid:
        return _err(400, 'item_id обязателен')
    amount = float(body.get('amount') or 0)
    payment_method = body.get('payment_method') or 'cash'
    contract_number = body.get('contract_number')
    notes = body.get('notes')
    client_id = body.get('client_id')
    client_data = body.get('client') or {}
    conn = get_conn(); cur = conn.cursor()
    try:
        if not client_id and client_data.get('full_name'):
            cur.execute(
                f"INSERT INTO {SCHEMA}.sl_clients (full_name, phone, passport_series, passport_number, notes) "
                f"VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (client_data.get('full_name'), client_data.get('phone'),
                 client_data.get('passport_series'), client_data.get('passport_number'),
                 client_data.get('notes')),
            )
            client_id = cur.fetchone()[0]

        cur.execute(
            f"UPDATE {SCHEMA}.sl_items SET status='sold', sell_client_id=%s, sell_date=NOW(), "
            f"sell_employee=%s, sell_price=%s, updated_at=NOW() WHERE id=%s",
            (client_id, employee_name, amount, iid),
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_operations (item_id, client_id, op_type, amount, payment_method, "
            f"contract_number, employee, notes) VALUES (%s,%s,'sale',%s,%s,%s,%s,%s)",
            (iid, client_id, amount, payment_method, contract_number, employee_name, notes),
        )
        conn.commit()
        return _ok({'ok': True, 'client_id': client_id})
    finally:
        cur.close(); conn.close()


def return_item(body: dict, employee_name: str):
    iid = body.get('item_id')
    if not iid:
        return _err(400, 'item_id обязателен')
    notes = body.get('notes')
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.sl_items SET status='returned', updated_at=NOW() WHERE id=%s",
            (iid,),
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_operations (item_id, op_type, amount, employee, notes) "
            f"VALUES (%s,'return',0,%s,%s)",
            (iid, employee_name, notes),
        )
        conn.commit()
        return _ok({'ok': True})
    finally:
        cur.close(); conn.close()


# ---------- Операции ----------

def list_operations(params: dict):
    op_type = (params.get('op_type') or '').strip()
    period = (params.get('period') or 'month').strip()
    where = []; values: list = []
    if op_type:
        where.append("o.op_type=%s"); values.append(op_type)
    days = {'today': 1, 'yesterday': 2, 'week': 7, 'month': 30, 'year': 365}.get(period, 30)
    if period == 'today':
        where.append("o.created_at::date=CURRENT_DATE")
    elif period == 'yesterday':
        where.append("o.created_at::date=CURRENT_DATE - INTERVAL '1 day'")
    elif period != 'all':
        where.append(f"o.created_at>=NOW() - INTERVAL '{days} days'")
    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT o.id, o.op_type, o.amount, o.payment_method, o.contract_number, o.employee, "
            f"o.notes, o.created_at, o.item_id, o.client_id, i.title AS item_title, "
            f"i.brand, i.model, cl.full_name AS client_name, cl.phone AS client_phone "
            f"FROM {SCHEMA}.sl_operations o "
            f"LEFT JOIN {SCHEMA}.sl_items i ON i.id=o.item_id "
            f"LEFT JOIN {SCHEMA}.sl_clients cl ON cl.id=o.client_id "
            f"{where_sql} ORDER BY o.created_at DESC LIMIT 500",
            values,
        )
        rows = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'items': rows})
    finally:
        cur.close(); conn.close()


# ---------- Сводка / статистика ----------

def get_stats(params: dict):
    period = (params.get('period') or 'month').strip()
    if period == 'today':
        date_filter = "created_at::date=CURRENT_DATE"
    elif period == 'yesterday':
        date_filter = "created_at::date=CURRENT_DATE - INTERVAL '1 day'"
    elif period == 'week':
        date_filter = "created_at>=NOW() - INTERVAL '7 days'"
    elif period == 'month':
        date_filter = "created_at>=NOW() - INTERVAL '30 days'"
    elif period == 'year':
        date_filter = "created_at>=NOW() - INTERVAL '365 days'"
    else:
        date_filter = "TRUE"

    conn = get_conn(); cur = conn.cursor()
    try:
        # купленно и продано за период
        cur.execute(
            f"SELECT op_type, COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total "
            f"FROM {SCHEMA}.sl_operations WHERE {date_filter} GROUP BY op_type"
        )
        by_type = {r[0]: {'count': r[1], 'total': float(r[2] or 0)} for r in cur.fetchall()}

        # склад
        cur.execute(
            f"SELECT status, COUNT(*) AS cnt, COALESCE(SUM(sell_price),0) AS total "
            f"FROM {SCHEMA}.sl_items GROUP BY status"
        )
        by_status: dict = {}
        for r in cur.fetchall():
            by_status[r[0]] = {'count': r[1], 'total': float(r[2] or 0)}

        cur.execute(
            f"SELECT location, COUNT(*) AS cnt FROM {SCHEMA}.sl_items "
            f"WHERE status='in_stock' GROUP BY location"
        )
        by_location = {r[0]: r[1] for r in cur.fetchall()}

        # прибыль за период (по дате продажи)
        if period == 'today':
            sell_filter = "sell_date::date=CURRENT_DATE"
        elif period == 'yesterday':
            sell_filter = "sell_date::date=CURRENT_DATE - INTERVAL '1 day'"
        elif period in ('week', 'month', 'year'):
            d = {'week': 7, 'month': 30, 'year': 365}[period]
            sell_filter = f"sell_date>=NOW() - INTERVAL '{d} days'"
        else:
            sell_filter = "TRUE"
        cur.execute(
            f"SELECT COALESCE(SUM(sell_price - purchase_price),0) AS profit, COUNT(*) AS cnt "
            f"FROM {SCHEMA}.sl_items WHERE status='sold' AND sell_date IS NOT NULL AND {sell_filter}"
        )
        prof_row = cur.fetchone()
        profit = float(prof_row[0] or 0)
        sold_in_period = prof_row[1] or 0

        # топ категорий по продажам
        cur.execute(
            f"SELECT c.name, COUNT(*) AS cnt, COALESCE(SUM(i.sell_price),0) AS total "
            f"FROM {SCHEMA}.sl_items i "
            f"LEFT JOIN {SCHEMA}.sl_categories c ON c.id=i.category_id "
            f"WHERE i.status='sold' GROUP BY c.name ORDER BY total DESC LIMIT 10"
        )
        top_cats = [{'name': r[0] or 'Без категории', 'count': r[1], 'total': float(r[2] or 0)} for r in cur.fetchall()]

        # ежедневная динамика (для графика) — последние 30 дней
        cur.execute(
            f"SELECT to_char(created_at::date,'YYYY-MM-DD') AS day, op_type, "
            f"COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total "
            f"FROM {SCHEMA}.sl_operations "
            f"WHERE created_at>=NOW() - INTERVAL '30 days' "
            f"GROUP BY day, op_type ORDER BY day"
        )
        daily_raw = cur.fetchall()
        daily_map: dict = {}
        for r in daily_raw:
            day, op, cnt, total = r[0], r[1], r[2], float(r[3] or 0)
            d = daily_map.setdefault(day, {'day': day, 'buyout_total': 0, 'buyout_count': 0,
                                           'sale_total': 0, 'sale_count': 0})
            if op == 'buyout':
                d['buyout_total'] = total; d['buyout_count'] = cnt
            elif op == 'sale':
                d['sale_total'] = total; d['sale_count'] = cnt
        daily = sorted(daily_map.values(), key=lambda x: x['day'])

        return _ok({
            'period': period,
            'by_type': by_type,
            'by_status': by_status,
            'by_location': by_location,
            'profit_period': profit,
            'sold_in_period': sold_in_period,
            'top_categories': top_cats,
            'daily': daily,
        })
    finally:
        cur.close(); conn.close()


# ---------- Шаблоны характеристик ----------

def find_specs(params: dict):
    """Поиск характеристик по названию/бренду/модели — для автоподстановки."""
    title = (params.get('title') or '').strip()
    brand = (params.get('brand') or '').strip()
    model = (params.get('model') or '').strip()
    if not title and not brand and not model:
        return _ok({'matches': []})
    conn = get_conn(); cur = conn.cursor()
    try:
        # точное совпадение бренд+модель
        results: list = []
        seen: set = set()
        if brand and model:
            cur.execute(
                f"SELECT id, brand, model, title_pattern, specs, use_count, is_builtin "
                f"FROM {SCHEMA}.sl_specs_templates "
                f"WHERE LOWER(brand)=LOWER(%s) AND LOWER(model)=LOWER(%s) "
                f"ORDER BY is_builtin DESC, use_count DESC LIMIT 10",
                (brand, model),
            )
            for r in cur.fetchall():
                d = row_to_dict(cur, r)
                if d['id'] in seen: continue
                seen.add(d['id']); results.append(d)
        # поиск по подстроке в названии
        if title:
            like = f"%{title}%"
            cur.execute(
                f"SELECT id, brand, model, title_pattern, specs, use_count, is_builtin "
                f"FROM {SCHEMA}.sl_specs_templates "
                f"WHERE title_pattern ILIKE %s OR (brand IS NOT NULL AND %s ILIKE '%%' || brand || '%%') "
                f"OR (model IS NOT NULL AND %s ILIKE '%%' || model || '%%') "
                f"ORDER BY is_builtin DESC, use_count DESC LIMIT 15",
                (like, title, title),
            )
            for r in cur.fetchall():
                d = row_to_dict(cur, r)
                if d['id'] in seen: continue
                seen.add(d['id']); results.append(d)
        return _ok({'matches': results[:15]})
    finally:
        cur.close(); conn.close()


def save_specs_template(body: dict):
    specs = (body.get('specs') or '').strip()
    if not specs:
        return _err(400, 'specs обязательны')
    brand = body.get('brand'); model = body.get('model')
    title_pattern = body.get('title_pattern') or body.get('title')
    category_id = body.get('category_id')
    conn = get_conn(); cur = conn.cursor()
    try:
        # если такой уже есть — увеличиваем use_count
        cur.execute(
            f"SELECT id FROM {SCHEMA}.sl_specs_templates "
            f"WHERE COALESCE(brand,'')=COALESCE(%s,'') AND COALESCE(model,'')=COALESCE(%s,'') "
            f"AND specs=%s LIMIT 1",
            (brand, model, specs),
        )
        existing = cur.fetchone()
        if existing:
            cur.execute(
                f"UPDATE {SCHEMA}.sl_specs_templates SET use_count=use_count+1, updated_at=NOW() WHERE id=%s",
                (existing[0],),
            )
            conn.commit()
            return _ok({'id': existing[0], 'updated': True})
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_specs_templates (category_id, brand, model, title_pattern, specs) "
            f"VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (category_id, brand, model, title_pattern, specs),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return _ok({'id': new_id})
    finally:
        cur.close(); conn.close()


# ---------- Форматы ценников ----------

def list_formats():
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, name, width_mm, height_mm, show_specs, show_barcode, show_logo, "
            f"font_family, is_default, is_thermal, sort_order "
            f"FROM {SCHEMA}.sl_pricetag_formats ORDER BY sort_order, id"
        )
        rows = [row_to_dict(cur, r) for r in cur.fetchall()]
        return _ok({'items': rows})
    finally:
        cur.close(); conn.close()


def upsert_format(body: dict):
    fid = body.get('id')
    name = (body.get('name') or '').strip()
    if not name:
        return _err(400, 'name обязателен')
    width_mm = float(body.get('width_mm') or 58)
    height_mm = float(body.get('height_mm') or 40)
    show_specs = bool(body.get('show_specs', True))
    show_barcode = bool(body.get('show_barcode', False))
    show_logo = bool(body.get('show_logo', True))
    font_family = body.get('font_family') or 'Arial'
    is_thermal = bool(body.get('is_thermal', True))
    sort_order = int(body.get('sort_order') or 100)
    conn = get_conn(); cur = conn.cursor()
    try:
        if fid:
            cur.execute(
                f"UPDATE {SCHEMA}.sl_pricetag_formats SET name=%s, width_mm=%s, height_mm=%s, "
                f"show_specs=%s, show_barcode=%s, show_logo=%s, font_family=%s, is_thermal=%s, "
                f"sort_order=%s WHERE id=%s",
                (name, width_mm, height_mm, show_specs, show_barcode, show_logo,
                 font_family, is_thermal, sort_order, fid),
            )
            conn.commit()
            return _ok({'id': fid})
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_pricetag_formats (name, width_mm, height_mm, show_specs, "
            f"show_barcode, show_logo, font_family, is_thermal, sort_order) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (name, width_mm, height_mm, show_specs, show_barcode, show_logo,
             font_family, is_thermal, sort_order),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return _ok({'id': new_id})
    finally:
        cur.close(); conn.close()


# ---------- Handler ----------

def handler(event: dict, context) -> dict:
    """API раздела «СмартЛомбард»: товары, операции, клиенты, статистика, ценники."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    try:
        body = json.loads(raw_body) if isinstance(raw_body, str) and raw_body else {}
    except Exception:
        body = {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers_in.get('x-employee-token', '').strip()

    action = params.get('action') or body.get('action') or ''

    # публичный health-check
    if action == 'ping':
        return _ok({'pong': True, 'time': datetime.utcnow().isoformat()})

    emp = auth_employee(token)
    if not emp:
        return _err(401, 'Требуется авторизация сотрудника')

    employee_name = emp.get('full_name') or emp.get('login') or 'staff'

    try:
        # GET
        if method == 'GET':
            if action == 'categories':       return list_categories()
            if action == 'clients':          return list_clients(params)
            if action == 'client':           return get_client(params)
            if action == 'items':            return list_items(params)
            if action == 'item':             return get_item(params)
            if action == 'operations':       return list_operations(params)
            if action == 'stats':            return get_stats(params)
            if action == 'find_specs':       return find_specs(params)
            if action == 'formats':          return list_formats()
            return _err(400, f'Неизвестное действие: {action}')

        # POST
        if method == 'POST':
            if action == 'category_save':    return create_category(body)
            if action == 'category_update':  return update_category(body)
            if action == 'client_save':      return upsert_client(body)
            if action == 'buyout':           return buyout_item(body, employee_name)
            if action == 'item_update':      return update_item(body)
            if action == 'sell':             return sell_item(body, employee_name)
            if action == 'return':           return return_item(body, employee_name)
            if action == 'specs_save':       return save_specs_template(body)
            if action == 'format_save':      return upsert_format(body)
            return _err(400, f'Неизвестное действие: {action}')

        return _err(405, f'Метод {method} не поддерживается')
    except Exception as e:
        return _err(500, f'Ошибка: {str(e)}')