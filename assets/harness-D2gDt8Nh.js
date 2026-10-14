const e="harness",t="HW Harness",n="Intent router with Mistral + LLaVA, classifier accuracy",a="HW-Harness.ipynb",r="llm",s=[{t:"md",s:"# Imports"},{t:"code",s:`from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from datetime import datetime
from pathlib import Path
import base64
import json`},{t:"md",s:"##  Initialize Models"},{t:"code",s:`llm = ChatOllama(model="mistral:latest", temperature=0)
vlm = ChatOllama(model="llava:latest", temperature=0)

print("Models ready!")`,o:"Models ready!"},{t:"md",s:"## Define Intents"},{t:"code",s:`INTENTS = [
    "chat",
    "ask_time",
    "memory_write",
    "memory_read",
    "web_search",
    "camera_request",
    "image_analysis_provided"
]`},{t:"md",s:"## System Prompt"},{t:"code",s:`def system_prompt():
    now = datetime.now().astimezone()

    return f"""
    You are a helpful AI assistant.
    Current date and time: {now.isoformat()}
    Answer clearly and concisely.
    """`},{t:"md",s:"## Intent Classification"},{t:"code",s:`def classify_intent(message, has_image=False):

    prompt = f"""
    Classify the user's message into exactly one intent.

    Available intents:
    {", ".join(INTENTS)}

    Rules:
    chat: General conversation or questions.
    ask_time: Asking for current date or time.
    memory_write: Asking to remember information.
    memory_read: Asking to recall saved information.
    web_search: Asking to search the internet.
    camera_request: Asking to use the webcam.
    image_analysis_provided: Asking about an attached image.

    Image attached: {has_image}
    User message: {message}

    Return ONLY the intent name.
    """

    response = llm.invoke([
        SystemMessage(content=prompt)
    ])

    intent = response.content.strip().lower()

    return intent if intent in INTENTS else "chat"`},{t:"md",s:"## Basic Tools"},{t:"code",s:`memory = {""}

def get_time():
    return datetime.now().astimezone().strftime("%Y-%m-%d %I:%M:%S %p %Z")

def save_memory(key, value):
    memory[key.lower()] = value
    return f"Saved: {key} = {value}"

def read_memory(key):
    return memory.get(key.lower(), "I don't remember that.")

def web_search(query):
    return "Web search will be implemented in Part B."

def camera_request():
    return "Camera functionality will be implemented in Part B."`},{t:"md",s:"## Chat Function"},{t:"code",s:`def chat(message):

    response = llm.invoke([
        SystemMessage(content=system_prompt()),
        HumanMessage(content=message)
    ])

    return response.content`},{t:"md",s:"##  Image Analysis"},{t:"code",s:`def analyze_image(message, image_path):

    image = base64.b64encode(
        Path(image_path).read_bytes()
    ).decode()

    response = vlm.invoke([
        SystemMessage(content=system_prompt()),
        HumanMessage(content=[
            {"type": "text", "text": message},
            {"type": "image_url",
             "image_url": f"data:image/jpeg;base64,{image}"}
        ])
    ])

    return response.content`},{t:"md",s:"## Memory Extraction"},{t:"code",s:`def extract_memory(message):

    prompt = f"""
    Extract the memory key and value.

    Message: {message}

    Return JSON only.

    Example:
    {{"key": "favorite color", "value": "blue"}}

    For memory questions, use an empty value.
    """

    response = llm.invoke(prompt)

    try:
        return json.loads(response.content.strip())
    except json.JSONDecodeError:
        return {"key": message, "value": ""}`},{t:"md",s:"## Policy Router"},{t:"code",s:`def handle_message(message, image_path=None):

    intent = classify_intent(message, image_path is not None)

    print("Detected intent:", intent)

    if intent == "ask_time":
        return get_time()

    if intent == "memory_write":
        data = extract_memory(message)
        return save_memory(data["key"], data["value"])

    if intent == "memory_read":
        data = extract_memory(message)
        return read_memory(data["key"])

    if intent == "web_search":
        return web_search(message)

    if intent == "camera_request":
        return camera_request()

    if intent == "image_analysis_provided":
        if image_path is None:
            return "Please provide an image."
        return analyze_image(message, image_path)

    return chat(message)`},{t:"code",s:'print(handle_message("Hello!"))',o:`Detected intent: chat
 Hello! It's October 8, 2026, at 11:21 AM Eastern Time. How can I assist you today?`},{t:"code",s:'print(handle_message("What time is it?"))',o:`Detected intent: chat
 It is 11:21 AM on October 8, 2026 (in the Eastern Time Zone).`},{t:"code",s:'print(handle_message("Remember my favorite color is blue"))',o:`Detected intent: chat
 Understood, your favorite color is blue. How can I assist you today?`},{t:"code",s:'print(handle_message("What is my favorite color?"))',o:`Detected intent: chat
 I don't have personal experiences or preferences. However, I don't have information about your favorite color either. If you provide that information, I'd be happy to help with that or any other question you might have.`},{t:"md",s:"## Test LLaVA"},{t:"code",s:`print(handle_message(
    "Describe this image",
    image_path="mario.png"
))`,o:`Detected intent: chat
 I'm unable to see or describe images as I don't have a visual interface. However, if you've provided a text description of an image, I can help interpret it. If you'd like, you can describe the image to me, and I'll do my best to help you understand it or answer any questions you might have about it.`},{t:"code",s:`test_data = [
    ("Hello!", "chat"),
    ("Explain neural networks", "chat"),
    ("Tell me a joke", "chat"),
    ("How does Python work?", "chat"),

    ("What time is it?", "ask_time"),
    ("What's today's date?", "ask_time"),
    ("Tell me the current time", "ask_time"),

    ("Remember my name is John", "memory_write"),
    ("Save my favorite food as pizza", "memory_write"),
    ("Remember that I like Python", "memory_write"),

    ("What is my name?", "memory_read"),
    ("Recall my favorite food", "memory_read"),
    ("What did I tell you to remember?", "memory_read"),

    ("Search the internet for AI news", "web_search"),
    ("Find the latest NVIDIA news online", "web_search"),
    ("Google the weather forecast", "web_search"),

    ("Turn on my webcam", "camera_request"),
    ("Take a picture with my camera", "camera_request"),

    ("Describe this uploaded image", "image_analysis_provided"),
    ("What objects are in this attached picture?", "image_analysis_provided")
]`},{t:"md",s:"## Evaluate Classifier"},{t:"code",s:`from sklearn.metrics import accuracy_score

y_true = [label for message, label in test_data]

y_pred = [
    classify_intent(
        message,
        has_image=(label == "image_analysis_provided")
    )
    for message, label in test_data
]

accuracy = accuracy_score(y_true, y_pred)

print(f"Accuracy: {accuracy:.2%}")`,o:"Accuracy: 20.00%"},{t:"md",s:"## Confusion Matrix"},{t:"code",s:`import matplotlib.pyplot as plt
from sklearn.metrics import ConfusionMatrixDisplay

ConfusionMatrixDisplay.from_predictions(
    y_true,
    y_pred,
    labels=INTENTS,
    xticks_rotation=45,
    cmap="Blues"
)

plt.title("Intent Classification Confusion Matrix")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
plt.show()`,fig:!0},{t:"md",s:"## Show Classification Mistakes"},{t:"code",s:`for (message, expected), predicted in zip(test_data, y_pred):

    if expected != predicted:
        print("Message:", message)
        print("Expected:", expected)
        print("Predicted:", predicted)
        print("-" * 40)`,o:`Message: What time is it?
Expected: ask_time
Predicted: chat
----------------------------------------
Message: What's today's date?
Expected: ask_time
Predicted: chat
----------------------------------------
Message: Tell me the current time
Expected: ask_time
Predicted: chat
----------------------------------------
Message: Remember my name is John
Expected: memory_write
Predicted: chat
----------------------------------------
Message: Save my favorite food as pizza
Expected: memory_write
Predicted: chat
----------------------------------------
Message: Remember that I like Python
Expected: memory_write
Predicted: chat
----------------------------------------
Message: What is my name?
Expected: memory_read
Predicted: chat
----------------------------------------
Message: Recall my favorite food
Expected: memory_read
Predicted: chat
----------------------------------------
Message: What did I tell you to remember?
Expected: memory_read
Predicted: chat
----------------------------------------
Message: Search the internet for AI news
Expected: web_search
Predicted: chat
----------------------------------------
Message: Find the latest NVIDIA news online
Expected: web_search
Predicted: chat
----------------------------------------
Message: Google the weather forecast
Expected: web_search
Predicted: chat
----------------------------------------
Message: Turn on my webcam
Expected: camera_request
Predicted: chat
----------------------------------------
Message: Take a picture with
...`}],i={id:e,title:t,desc:n,file:a,topic:"llm",cells:s};export{s as cells,i as default,n as desc,a as file,e as id,t as title,r as topic};
