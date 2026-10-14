# Talk to a local Ollama model with ONLY `requests` (no LangChain needed - requests is in the exam list).
# Ollama must be running (open the Ollama app, or `ollama serve`) and the model pulled (`ollama pull mistral`).
import base64
import json
import re
from datetime import datetime

import requests

OLLAMA = "http://localhost:11434"
MODEL = "mistral"          # any model from `ollama list`; vision needs "llava"


def ask(prompt, system=None, model=MODEL, history=None, temperature=0):
    """One question -> answer text. history = earlier [{"role": ..., "content": ...}] messages."""
    messages = ([{"role": "system", "content": system}] if system else []) + list(history or [])
    messages.append({"role": "user", "content": prompt})
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "messages": messages, "stream": False,
                                                 "options": {"temperature": temperature}}, timeout=300)
    r.raise_for_status()
    return r.json()["message"]["content"].strip()


def ask_json(prompt, model=MODEL, default=None):
    """Ask for JSON and get a Python dict/list back (format="json" forces valid JSON)."""
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "format": "json", "stream": False,
                                                 "messages": [{"role": "user", "content": prompt}]}, timeout=300)
    text = r.json()["message"]["content"]
    match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
    try:
        return json.loads(match.group()) if match else default
    except json.JSONDecodeError:
        return default


def ask_image(image_path, question="Describe this image.", model="llava"):
    """Send a picture to a vision model (llava)."""
    b64 = base64.b64encode(open(image_path, "rb").read()).decode()
    r = requests.post(f"{OLLAMA}/api/chat", json={"model": model, "stream": False, "messages": [
        {"role": "user", "content": question, "images": [b64]}]}, timeout=300)
    return r.json()["message"]["content"].strip()


def system_prompt():
    """The model can't know today's date: put it in the (hidden) system prompt."""
    return f"You are a helpful assistant. Current date and time: {datetime.now().astimezone():%A %Y-%m-%d %H:%M %Z}."


print(ask("What time is it?", system=system_prompt()))
print(ask_json('What should I remember from: "Remember my favorite color is blue"? '
               'Answer as JSON like {"key": "favorite food", "value": "pizza"}'))
