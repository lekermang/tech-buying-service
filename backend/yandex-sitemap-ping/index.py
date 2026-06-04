import os
import json
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """
    Уведомляет Яндекс о новом sitemap.xml через ping-URL.
    Также показывает текущее состояние sitemap в Яндекс.Вебмастере через API v4.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
            },
            'body': ''
        }

    token = os.environ['YANDEX_WEBMASTER_TOKEN']
    sitemap_url = 'https://skypka24.com/sitemap.xml'
    base = 'https://api.webmaster.yandex.net/v4/user'
    req_headers = {
        'Authorization': f'OAuth {token}',
        'Content-Type': 'application/json',
    }

    results = {}

    # 1. Яндекс ping URL (классический способ уведомления краулера)
    yandex_ping = f'https://webmaster.yandex.ru/ping?sitemap={urllib.parse.quote(sitemap_url, safe="")}'
    try:
        req = urllib.request.Request(yandex_ping, method='GET')
        with urllib.request.urlopen(req, timeout=10) as r:
            results['yandex_ping'] = {'status': r.status, 'ok': r.status == 200}
    except Exception as e:
        results['yandex_ping'] = {'status': None, 'error': str(e)}

    # 2. Google ping (бонус)
    google_ping = f'https://www.google.com/ping?sitemap={urllib.parse.quote(sitemap_url, safe="")}'
    try:
        req = urllib.request.Request(google_ping, method='GET')
        with urllib.request.urlopen(req, timeout=10) as r:
            results['google_ping'] = {'status': r.status, 'ok': r.status == 200}
    except Exception as e:
        results['google_ping'] = {'status': None, 'error': str(e)}

    # 3. Проверить текущее состояние через API (read-only)
    try:
        def api_get(url):
            req = urllib.request.Request(url, headers=req_headers, method='GET')
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read().decode())

        user_data = api_get(f'{base}/')
        user_id = user_data['user_id']
        hosts_data = api_get(f'{base}/{user_id}/hosts/')
        host_id = None
        for h in hosts_data.get('hosts', []):
            ascii_url = h.get('ascii_host_url', '')
            if 'skypka24.com' in ascii_url and 'https' in ascii_url:
                host_id = h['host_id']
                break
        if host_id:
            sm_data = api_get(f'{base}/{user_id}/hosts/{host_id}/sitemaps/')
            for sm in sm_data.get('sitemaps', []):
                if sm.get('sitemap_url') == sitemap_url:
                    results['webmaster_info'] = {
                        'sitemap_id': sm.get('sitemap_id'),
                        'last_access': sm.get('last_access_date'),
                        'urls_count': sm.get('urls_count'),
                        'errors_count': sm.get('errors_count'),
                        'sources': sm.get('sources'),
                    }
                    break
    except Exception as e:
        results['webmaster_info'] = {'error': str(e)}

    ping_ok = results.get('yandex_ping', {}).get('ok', False)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'ok': ping_ok,
            'sitemap_url': sitemap_url,
            **results,
        }, ensure_ascii=False)
    }
