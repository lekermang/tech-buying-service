"""
Прокси для API instrument.ru — получение товаров, цен, остатков.
Поддерживает методы: get.products.list, shop.order.add, shop.order.getStateId, shop.order.delivery.address
"""
import json
import os
import urllib.request
import urllib.error

BASE_URL = "https://instrument.ru/api.php"
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # Проверка токена админа
    admin_token = event.get("headers", {}).get("X-Admin-Token", "")
    if admin_token != os.environ.get("ADMIN_TOKEN", ""):
        return {"statusCode": 401, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps({"error": "Unauthorized"})}

    params = event.get("queryStringParameters") or {}
    method = params.get("method", "get.products.list")
    limit = int(params.get("limit", 50))
    offset = int(params.get("offset", 0))

    access_token = os.environ.get("INSTRUMENT_API_TOKEN", "")

    payload = {
        "access_token": access_token,
        "format": "json",
    }

    if method == "get.products.list":
        payload["limit"] = limit
        payload["offset"] = offset

    url = f"{BASE_URL}/{method}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read().decode("utf-8")
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": data,
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return {
            "statusCode": e.code,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": err_body}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }