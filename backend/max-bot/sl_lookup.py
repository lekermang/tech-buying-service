"""Поиск похожих закупок в истории СмартЛомбард (slshop_items)
для подсказки ИИ при оценке техники."""
import os
import re

import psycopg2
import psycopg2.extras

SCHEMA = 't_p31606708_tech_buying_service'

_STOP = {'за', 'на', 'в', 'и', 'с', 'по', 'гб', 'gb', 'tb', 'сколько', 'дадите',
         'дайте', 'оцените', 'оценить', 'стоит', 'цена', 'продать', 'куплю',
         'хочу', 'это', 'мой', 'моя', 'состоянии', 'состояние', 'хорошем',
         'отличном', 'это', 'телефон', 'смартфон', 'версия', 'память'}


def _keywords(text: str) -> list:
    text = (text or '').lower()
    text = re.sub(r'([a-zа-я])(\d)', r'\1 \2', text)
    words = re.findall(r'[a-zа-яё0-9]+', text)
    return [w for w in words if w not in _STOP and len(w) >= 2]


def find_similar_buys(text: str, limit: int = 6) -> list:
    kw = _keywords(text)
    if not kw:
        return []
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return []
    brand_terms = [w for w in kw if w in ('iphone', 'samsung', 'galaxy', 'xiaomi',
                   'redmi', 'poco', 'huawei', 'honor', 'apple', 'dyson', 'macbook',
                   'ipad', 'airpods', 'watch', 'realme', 'oppo', 'vivo', 'nokia')]
    num_terms = [w for w in kw if w.isdigit()]
    pick = (brand_terms[:1] + num_terms[:2]) or kw[:3]
    conds = []
    for t in pick:
        safe = t.replace("'", "''")
        conds.append(f"(title ILIKE '%{safe}%' OR model ILIKE '%{safe}%')")
    where = ' AND '.join(conds)
    sql = (
        f"SELECT title, model, storage_gb, condition, buy_price, sell_price, status, buy_at "
        f"FROM {SCHEMA}.slshop_items "
        f"WHERE buy_price > 0 AND ({where}) "
        f"ORDER BY buy_at DESC NULLS LAST LIMIT {int(limit)}"
    )
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f'[sl_lookup] error: {e}')
        return []


def buys_hint(text: str) -> str:
    rows = find_similar_buys(text)
    if not rows:
        return ''
    lines = []
    for r in rows:
        stor = f"{r['storage_gb']}гб" if r.get('storage_gb') else ''
        cond = r.get('condition') or ''
        buy = int(float(r['buy_price'])) if r.get('buy_price') else 0
        sell = int(float(r['sell_price'])) if r.get('sell_price') else 0
        lines.append(f"- {r.get('title') or r.get('model')} {stor} {cond}: "
                     f"купили за {buy} ₽, продаём за {sell} ₽".replace('  ', ' '))
    return ("РЕАЛЬНАЯ ИСТОРИЯ ЗАКУПОК СмартЛомбард (за сколько мы реально брали похожее):\n"
            + "\n".join(lines))
