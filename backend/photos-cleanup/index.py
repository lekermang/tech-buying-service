"""
Photos cleanup — cron-функция чистки просроченных фото в lead_photos.

Удаляет из S3 объекты, где expires_at < NOW() AND deleted = FALSE,
помечает их deleted=TRUE.

Запускается раз в час cron'ом (без аргументов). Опциональная защита X-Cron-Token.
"""
import json
import os
import psycopg2
import boto3
from botocore.client import Config as BotoConfig

SCHEMA = 't_p31606708_tech_buying_service'
S3_BUCKET = 'files'
S3_ENDPOINT = 'https://bucket.poehali.dev'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Cron-Token',
    'Content-Type': 'application/json; charset=utf-8',
}


def _s3():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _ok(payload, status=200):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    # Проверка опционального cron-токена
    required = os.environ.get('CRON_TOKEN', '')
    if required:
        hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
        got = (hdrs.get('x-cron-token') or '').strip()
        if got != required:
            return _ok({'ok': False, 'error': 'cron token required'}, status=401)

    deleted = 0
    errors = 0
    s3 = _s3()

    try:
        conn = _conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, s3_key FROM {SCHEMA}.lead_photos "
            f"WHERE expires_at < NOW() AND is_purged = FALSE "
            f"ORDER BY id ASC LIMIT 500"
        )
        rows = cur.fetchall()
        for (pid, s3_key) in rows:
            try:
                s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
            except Exception as e:
                errors += 1
                print(f'[photos-cleanup] S3 delete failed key={s3_key}: {e}')
                # Помечаем deleted всё равно, чтобы не зацикливаться
            try:
                cur.execute(
                    f"UPDATE {SCHEMA}.lead_photos SET is_purged=TRUE WHERE id=%s",
                    (pid,)
                )
                deleted += 1
            except Exception as e:
                errors += 1
                print(f'[photos-cleanup] DB update failed id={pid}: {e}')
        conn.commit()
        cur.close(); conn.close()
    except Exception as e:
        return _ok({'ok': False, 'error': str(e), 'deleted': deleted, 'errors': errors}, status=500)

    return _ok({'ok': True, 'deleted': deleted, 'errors': errors})