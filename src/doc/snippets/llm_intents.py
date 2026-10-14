# HW-Harness: the LLM sorts each message into an intent, then a router calls the right tool.
# Needs the LangChain basics block (get_llm). Includes accuracy + confusion matrix of the classifier.
import re
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, ConfusionMatrixDisplay

INTENTS = {                                   # name -> description the LLM reads (edit freely)
    "chat": "General conversation or knowledge questions.",
    "ask_time": "Asking for the current date or time.",
    "memory_write": "Asking to remember or save information.",
    "memory_read": "Asking to recall information saved earlier.",
    "web_search": "Needs recent, live or online information (news, weather, prices).",
    "camera_request": "Asking to use the webcam or take a picture.",
    "image_analysis": "Asking about an attached image.",
}


def classify_intent(llm, message, intents=INTENTS, default="chat", has_image=False):
    """LLM picks exactly one intent name. Rule shortcuts first (fast and reliable)."""
    if has_image:
        return "image_analysis"
    if re.match(r"\s*(remember|save|note)\b", message, re.I):
        return "memory_write"
    rules = "\n".join(f"- {name}: {desc}" for name, desc in intents.items())
    prompt = (f"Classify the user message into exactly one intent.\n\nIntents:\n{rules}\n\n"
              f"User message: {message}\n\nReturn ONLY the intent name.")
    reply = str(llm.invoke(prompt).content).strip().lower()
    for name in sorted(intents, key=len, reverse=True):      # accept "Intent: ask_time." etc.
        if re.search(rf"\b{re.escape(name)}\b", reply):
            return name
    return default


def evaluate_intents(classify, test_data, labels=None):
    """classify: message -> intent.  test_data: [(message, expected_intent), ...]."""
    y_true = [label for _, label in test_data]
    y_pred = [classify(message) for message, _ in test_data]
    acc = accuracy_score(y_true, y_pred)
    print(f"Accuracy: {acc:.2%}")
    for (message, expected), got in zip(test_data, y_pred):
        if expected != got:
            print(f"  '{message}' -> expected {expected}, got {got}")
    labels = labels or sorted(set(y_true) | set(y_pred))
    ConfusionMatrixDisplay.from_predictions(y_true, y_pred, labels=labels, xticks_rotation=45,
                                            cmap="Blues", colorbar=False)
    plt.title("Intent confusion matrix")
    plt.tight_layout()
    plt.show()
    return acc


llm = get_llm("mistral")
test_data = [
    ("Hello!", "chat"), ("Explain neural networks", "chat"),
    ("What time is it?", "ask_time"), ("What's today's date?", "ask_time"),
    ("Remember my name is John", "memory_write"), ("Save my favorite food as pizza", "memory_write"),
    ("What is my name?", "memory_read"), ("Recall my favorite food", "memory_read"),
    ("Search the internet for AI news", "web_search"), ("Google the weather forecast", "web_search"),
    ("Turn on my webcam", "camera_request"), ("Take a picture with my camera", "camera_request"),
]
evaluate_intents(lambda m: classify_intent(llm, m), test_data, labels=list(INTENTS))
