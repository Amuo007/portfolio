# LangChain + Ollama basics (HW02 Part B, HW-Harness).
# pip install langchain-core langchain-ollama      then: ollama pull mistral
import json
import re
from datetime import datetime

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage


def get_llm(model="mistral", temperature=0, base_url="http://localhost:11434"):
    """temperature 0 = same answer every time (best for classifying); higher = more creative."""
    return ChatOllama(model=model, temperature=temperature, base_url=base_url)


def system_prompt(extra=""):
    """Hidden instructions + today's date/time (the model can't know it otherwise)."""
    now = datetime.now().astimezone()
    return (f"You are a helpful AI assistant.\nCurrent date and time: {now:%A, %Y-%m-%d %H:%M %Z}\n"
            f"Answer clearly and concisely. Never invent facts or sources.\n{extra}")


def ask(llm, question, system=None, history=None):
    """One question -> answer text. history = earlier messages (e.g. ShortMemory().messages())."""
    messages = [SystemMessage(content=system or system_prompt())]
    messages += list(history or [])
    messages.append(HumanMessage(content=question))
    return str(llm.invoke(messages).content).strip()


def parse_json(text, default=None):
    """Pull the first {...} or [...] out of model text. Returns default if none parses."""
    match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", str(text))
    if not match:
        return default
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return default


def ask_json(llm, prompt, default=None):
    """Ask for JSON and get a Python dict/list back."""
    return parse_json(ask(llm, prompt + "\n\nReturn ONLY valid JSON, no other text."), default)


llm = get_llm("mistral")
print(ask(llm, "What is the current time?"))     # correct now: the time is in the system prompt
