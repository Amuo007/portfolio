const t="hw02b",e="HW02 Part B",o="LangChain + Ollama: ask Mistral the time, fix it with a tool",n="HW-2B.ipynb",a="llm",i=[{t:"code",s:"from langchain_ollama import OllamaLLM"},{t:"code",s:`# Connect LangChain to the local Mistral model through Ollama

llm = OllamaLLM(model="mistral")`},{t:"code",s:`# Ask Mistral a question

response = llm.invoke("What is the current time?")`},{t:"code",s:"print(response)",o:" I don't have real-time capabilities, so I can't tell you the current time. However, I can help you understand how to check the current time on various devices. On a computer, you can usually find the current time in the system tray, and on a mobile device, it's typically visible on the home screen. If you're looking for the time in a specific time zone, you can often find this information online or through weather apps."},{t:"code",s:`# WRONG ANSWER

# The model does not have access to live time, so it cannot answer correctly.

# SOLUTION

# We need a **tool** that can provide live information to the LLM.

# For example, we can use an MCP tool, a LangChain tool, or manually connect a function to the LLM:

# Function with context describing what it does, its arguments (if any), and what it returns`},{t:"code",s:`from datetime import datetime

from langchain_core.tools import tool`},{t:"code",s:`@tool

def get_current_time() -> str:

    """Returns the current local time."""

    return datetime.now().strftime("%I:%M:%S %p")`},{t:"code",s:"print(get_current_time.invoke({}))",o:"12:17:26 PM"},{t:"code",s:"from langchain_ollama import ChatOllama"},{t:"code",s:`response = llm_with_tools.invoke("What is the current time?")

tool_call = response.tool_calls[0]

tool_result = get_current_time.invoke(tool_call["args"])

print(tool_result)`,o:"12:17:50 PM"}],l={id:t,title:e,desc:o,file:n,topic:"llm",cells:i};export{i as cells,l as default,o as desc,n as file,t as id,e as title,a as topic};
