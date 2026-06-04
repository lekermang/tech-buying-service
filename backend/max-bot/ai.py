"""
ИИ-ассистент Скупка24 на базе Polza.ai (ChatGPT).
Отвечает клиентам в MAX, пока живой менеджер не подключился к диалогу.
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

Правила общения:
- Отвечай коротко, дружелюбно, по-русски, на «вы».
- Помогай по вопросам скупки, ремонта, продажи Б/У, режима работы, адреса.
- Можешь называть ОРИЕНТИРОВОЧНЫЕ цены/вилки, но всегда добавляй, что точную сумму
  назовёт менеджер после осмотра/уточнения модели и состояния.
- Если вопрос требует решения человека (конкретная сделка, спор, нестандартная ситуация) —
  скажи, что менеджер скоро подключится и ответит.
- Не выдумывай факты, которых не знаешь. Не обещай того, в чём не уверен.
- Отвечай 1–3 короткими предложениями, без длинных списков."""


def ask_deepseek(user_text: str, history: list | None = None) -> str | None:
    """
    Возвращает ответ ИИ или None при ошибке/пустом ключе.
    history — список {'role': 'user'|'assistant', 'content': str} для контекста диалога.
    """
    api_key = os.environ.get('POLZA_AI_API_KEY', '').strip()
    if not api_key or not (user_text or '').strip():
        return None

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
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