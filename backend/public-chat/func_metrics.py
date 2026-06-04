"""Лёгкий трекер вызовов облачных функций + чтение реальной статистики.
Каждый вызов пишется в таблицу func_metrics; анализ считает реальные цифры."""
import os
import time

import psycopg2
import psycopg2.extras

SCHEMA = 't_p31606708_tech_buying_service'

# Человекочитаемые названия функций для отчёта
FUNC_LABELS = {
    'public-chat': 'Чат с сайта',
    'leads-monitor': 'Монитор заявок',
    'analytics': 'Аналитика посетителей',
    'employee-auth': 'Вход сотрудников',
    'repair-admin': 'Админ ремонта',
    'gold-price': 'Курс золота',
    'auth-client': 'Вход клиентов',
    'slshop': 'Магазин Б/У',
}


def track(func_name: str, status_code: int = 200, started_at: float = None):
    """Записывает метрику вызова. started_at — time.time() в начале обработки."""
    try:
        dur_ms = int((time.time() - started_at) * 1000) if started_at else 0
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.func_metrics (func_name, status_code, duration_ms, is_error) "
            f"VALUES (%s, %s, %s, %s)",
            (func_name[:80], int(status_code), dur_ms, status_code >= 400),
        )
        conn.commit(); cur.close(); conn.close()
    except Exception as e:
        print(f'[func_metrics] track error: {e}')


def read_stats(days: int = 7) -> dict:
    """Реальная статистика по функциям за N дней: вызовы, ошибки %, среднее время, часы."""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {'functions': [], 'has_data': False}
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"""SELECT func_name,
                       COUNT(*) AS calls,
                       SUM(CASE WHEN is_error THEN 1 ELSE 0 END) AS errors,
                       COALESCE(AVG(duration_ms), 0) AS avg_ms
                FROM {SCHEMA}.func_metrics
                WHERE created_at >= now() - (%s || ' days')::interval
                GROUP BY func_name
                ORDER BY calls DESC""",
            (int(days),),
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
    except Exception as e:
        print(f'[func_metrics] read error: {e}')
        return {'functions': [], 'has_data': False}

    funcs = []
    for r in rows:
        calls = int(r['calls'] or 0)
        errors = int(r['errors'] or 0)
        avg_ms = float(r['avg_ms'] or 0)
        # часы compute за период (округление таймаута здесь не учитываем — берём фактику)
        hours = round(calls * (avg_ms / 1000) / 3600, 1)
        funcs.append({
            'name': r['func_name'],
            'label': FUNC_LABELS.get(r['func_name'], r['func_name']),
            'calls': calls,
            'errorsPct': round(errors * 100 / calls, 1) if calls else 0,
            'avgSec': round(avg_ms / 1000, 2),
            'hours': hours,
        })
    total_calls = sum(f['calls'] for f in funcs)
    return {
        'functions': funcs,
        'has_data': total_calls > 0,
        'total_calls': total_calls,
        'total_hours': round(sum(f['hours'] for f in funcs), 1),
        'days': days,
    }
