# Tools = Python functions the LLM may call (HW02 Part B fix: the model can't read a clock).
from datetime import datetime

from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage


@tool
def get_current_time() -> str:
    """Returns the current local date and time."""     # the LLM reads this docstring to decide
    return datetime.now().astimezone().strftime("%Y-%m-%d %I:%M:%S %p %Z")


@tool
def add_numbers(a: float, b: float) -> float:
    """Adds two numbers and returns the sum."""
    return a + b


def run_with_tools(llm, question, tools, max_rounds=3):
    """Let the LLM call tools until it can answer. Returns the final answer text.
    Needs a tool-capable model in Ollama: mistral, llama3.1, qwen2.5."""
    llm_tools = llm.bind_tools(tools)
    by_name = {t.name: t for t in tools}
    messages = [HumanMessage(content=question)]
    for _ in range(max_rounds):
        reply = llm_tools.invoke(messages)
        messages.append(reply)
        if not reply.tool_calls:                         # no tool needed -> final answer
            return str(reply.content)
        for call in reply.tool_calls:                    # run each tool the model asked for
            result = by_name[call["name"]].invoke(call["args"])
            print(f"[tool] {call['name']}({call['args']}) -> {result}")
            messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    return str(llm.invoke(messages).content)


llm = ChatOllama(model="mistral", temperature=0)
print(run_with_tools(llm, "What time is it right now?", [get_current_time, add_numbers]))
