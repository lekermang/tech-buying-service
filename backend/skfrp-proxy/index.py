import json
import time
import urllib.request
import urllib.error

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SKFRP_BASE = 'http://80.78.253.62'
CACHE_TTL = 300  # 5 минут
_cache = {'data': None, 'at': 0}


def _ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}


def fetch_services():
    req = urllib.request.Request(
        f'{SKFRP_BASE}/api/services',
        headers={'Accept': 'application/json', 'User-Agent': 'skupka24-proxy'},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = resp.read().decode('utf-8')
    return json.loads(raw)


def handler(event: dict, context) -> dict:
    """Прокси к внешнему сервису SKfrp: публично отдаёт список услуг ремонта (с кэшем 5 мин)."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    now = time.time()
    if _cache['data'] is not None and (now - _cache['at']) < CACHE_TTL:
        return _ok({'ok': True, 'services': _cache['data'], 'cached': True})

    try:
        services = fetch_services()
        if not isinstance(services, list):
            services = []
        _cache['data'] = services
        _cache['at'] = now
        return _ok({'ok': True, 'services': services, 'cached': False})
    except Exception as e:
        # Если внешний сервис недоступен — отдаём последний кэш, если есть
        if _cache['data'] is not None:
            return _ok({'ok': True, 'services': _cache['data'], 'cached': True, 'stale': True})
        return _ok({'ok': False, 'services': [], 'error': f'{type(e).__name__}: {e}'}, 200)
