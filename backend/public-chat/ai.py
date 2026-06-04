"""
ИИ-ассистент Скупка24 на базе Polza.ai (ChatGPT).
Отвечает клиентам пока живой менеджер не подключился к диалогу.
"""
import os
import json
import urllib.request

AI_URL = 'https://api.polza.ai/v1/chat/completions'
AI_MODEL = 'gpt-4o-mini'

SYSTEM_PROMPT = """Ты — вежливый ассистент компании «Скупка24» (skypka24.com) из Калуги.
Компания: скупка и ремонт техники (телефоны, ноутбуки, технику Apple, фото, Dyson и др.),
а также продажа Б/У техники.

Контакты и факты:
- Телефон: +7 (992) 999-03-33
- Адрес: г. Калуга, ул. Кирова, 11
- Принимаем технику на скупку и ремонт, делаем быструю оценку.

КАК СЧИТАТЬ ЦЕНУ СКУПКИ (по приоритету):
1) ЕСЛИ ниже есть блок «РЕАЛЬНАЯ ИСТОРИЯ ЗАКУПОК СмартЛомбард» с похожей моделью —
   опирайся в первую очередь на эти реальные цены (за сколько мы реально брали такое).
   Назови цену скупки в диапазоне наших реальных закупок похожей модели.
2) ЕСЛИ похожих закупок нет — считай по формуле от рынка Avito.ru:
   - АЙФОНЫ (iPhone): цена скупки = рыночная цена б/у на Avito МИНУС 5000 ₽.
   - ОСТАЛЬНАЯ техника: цена скупки = 50% от рыночной цены на Avito.
- Назови ОРИЕНТИРОВОЧНУЮ сумму. Всегда добавляй, что точную назовёт менеджер после осмотра.

Правила общения:
- Отвечай коротко, дружелюбно, по-русски, на «вы».
- Помогай по вопросам скупки, ремонта, продажи Б/У, режима работы, адреса.
- Если вопрос требует решения человека (конкретная сделка, спор, нестандартная ситуация) —
  скажи, что менеджер скоро подключится и ответит.
- Не выдумывай факты, которых не знаешь. Не обещай того, в чём не уверен.
- Отвечай 1–3 короткими предложениями, без длинных списков."""


def ask_deepseek(user_text: str, history: list | None = None, extra: str = '') -> str | None:
    """
    Возвращает ответ ИИ или None при ошибке/пустом ключе.
    history — список {'role': 'user'|'assistant', 'content': str} для контекста диалога.
    extra — доп. контекст (например, история закупок СмартЛомбард).
    """
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (user_text or '').strip():
        return None

    sys_prompt = SYSTEM_PROMPT + ('\n\n' + extra if extra else '')
    messages = [{'role': 'system', 'content': sys_prompt}]
    if history:
        messages.extend(history[-8:])
    messages.append({'role': 'user', 'content': user_text.strip()[:2000]})

    payload = json.dumps({
        'model': AI_MODEL,
        'messages': messages,
        'temperature': 0.4,
        'max_tokens': 300,
    }).encode('utf-8')

    req = urllib.request.Request(
        AI_URL,
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        answer = data['choices'][0]['message']['content'].strip()
        return answer or None
    except Exception as e:
        print(f'[ai][polza] error: {e}')
        return None


VISION_PROMPT = SYSTEM_PROMPT + """

Сейчас клиент прислал ФОТО техники. Твоя задача:
- Определи что на фото (тип устройства, модель/бренд если видно).
- Оцени видимое состояние (царапины, трещины, потёртости, комплект).
- Дай ОРИЕНТИРОВОЧНУЮ цену скупки, добавь что точную назовёт менеджер после осмотра.
- Если на фото не техника или непонятно — вежливо попроси прислать фото чётче."""


def ask_vision(image_url: str, user_text: str = '', extra: str = '') -> str | None:
    """Распознаёт фото техники и даёт ориентировочную оценку. image_url — публичный URL картинки."""
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (image_url or '').strip():
        return None
    sys_prompt = VISION_PROMPT + ('\n\n' + extra if extra else '')
    user_content = [
        {'type': 'text', 'text': (user_text or 'Что это за техника и сколько примерно стоит скупка?')[:1000]},
        {'type': 'image_url', 'image_url': {'url': image_url}},
    ]
    payload = json.dumps({
        'model': AI_MODEL,
        'messages': [
            {'role': 'system', 'content': sys_prompt},
            {'role': 'user', 'content': user_content},
        ],
        'temperature': 0.4,
        'max_tokens': 400,
    }).encode('utf-8')
    req = urllib.request.Request(
        AI_URL, data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        answer = data['choices'][0]['message']['content'].strip()
        return answer or None
    except Exception as e:
        print(f'[ai][vision] error: {e}')
        return None