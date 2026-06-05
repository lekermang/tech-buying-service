"""
Проксирование запросов к 3gsm.ru API (Dhru Fusion).
Доступные actions: getBalance, getServices, getOrderList, createOrder, getOrderStatus
"""
import json
import os
import urllib.request
import urllib.parse


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

API_BASE = "https://3gsm.ru/index.php"


def call_api(params: dict) -> dict:
    """Выполнить запрос к 3gsm.ru API и вернуть распарсенный ответ."""
    api_key = os.environ.get("GSMSM_API_KEY", "")
    params["key"] = api_key
    params["api"] = "true"

    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(API_BASE, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")

    # Dhru Fusion может вернуть XML или JSON
    body = body.strip()
    if body.startswith("{") or body.startswith("["):
        return {"raw": json.loads(body), "format": "json"}
    return {"raw": body, "format": "xml"}


def handler(event: dict, context) -> dict:
    """Прокси к 3gsm.ru API — баланс, услуги, заказы, создание заказа."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        params_raw = event.get("queryStringParameters") or {}
        action = params_raw.get("action", "getBalance")
        params = {"action": action}
        if "orderid" in params_raw:
            params["orderid"] = params_raw["orderid"]
    else:
        body_str = event.get("body") or "{}"
        params = json.loads(body_str)

    result = call_api(params)

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(result),
    }
