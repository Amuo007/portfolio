# HW07: chatbot with vision (LLaVA), camera, web search, short + long memory.
# pip install langchain-core langchain-ollama langchain-community langchain-huggingface sentence-transformers faiss-cpu ddgs
# Needs blocks: LangChain basics, Intent router.   ollama pull mistral  +  ollama pull llava
import base64
import mimetypes
import shutil
from collections import deque
from datetime import datetime
from pathlib import Path

import cv2
from langchain_core.messages import HumanMessage, AIMessage


# ---------- vision ----------
def ask_about_image(vlm, image_path, question="Describe this image."):
    path = Path(image_path).expanduser()
    if not path.is_file():
        return f"Image not found: {image_path}"
    mime = mimetypes.guess_type(str(path))[0] or "image/jpeg"
    b64 = base64.b64encode(path.read_bytes()).decode()
    msg = HumanMessage(content=[{"type": "text", "text": question},
                                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}])
    return str(vlm.invoke([msg]).content).strip()


def capture_camera(path="camera_capture.jpg", camera_index=0):
    """One webcam photo -> saved file path (None if there is no camera / no permission)."""
    cam = cv2.VideoCapture(camera_index)
    ok, frame = cam.read() if cam.isOpened() else (False, None)
    cam.release()
    if not ok:
        return None
    cv2.imwrite(path, frame)
    return path


# ---------- web search (DuckDuckGo, no API key) ----------
def web_search(query, max_results=5):
    try:
        from ddgs import DDGS
        return [{"title": r.get("title", ""), "url": r.get("href", ""), "snippet": r.get("body", "")}
                for r in DDGS().text(query, max_results=max_results)]
    except Exception as error:
        print("[web] search failed:", error)
        return []


# ---------- memory ----------
class ShortMemory:
    """Last N question/answer turns of this session (forgotten on restart)."""
    def __init__(self, turns=5):
        self.turns = deque(maxlen=turns)

    def add(self, question, answer):
        self.turns.append((question, answer))

    def messages(self):
        out = []
        for q, a in self.turns:
            out += [HumanMessage(content=q), AIMessage(content=a)]
        return out

    def clear(self):
        self.turns.clear()


class LongMemory:
    """Facts saved in a FAISS vector store on disk (survives restarts). Search by MEANING."""
    def __init__(self, path="faiss_memory", model_name="sentence-transformers/all-MiniLM-L6-v2"):
        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings
        self.FAISS, self.path = FAISS, path
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.db = (FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)
                   if Path(path).exists() else None)   # only load an index you created yourself

    def add(self, text):
        meta = {"time": datetime.now().isoformat()}
        if self.db is None:
            self.db = self.FAISS.from_texts([text], self.embeddings, metadatas=[meta])
        else:
            self.db.add_texts([text], metadatas=[meta])
        self.db.save_local(self.path)

    def search(self, query, k=3):
        return [] if self.db is None else [d.page_content for d in self.db.similarity_search(query, k=k)]

    def clear(self):
        self.db = None
        shutil.rmtree(self.path, ignore_errors=True)


# ---------- the chatbot ----------
llm = get_llm("mistral")
vlm = get_llm("llava")
short_memory = ShortMemory(turns=5)
long_memory = LongMemory("faiss_memory")


def chatbot(question, image_path=None):
    """Route by intent, use tools/memory, answer, remember the turn."""
    intent = classify_intent(llm, question, has_image=image_path is not None)
    print("[intent]", intent)

    if intent == "image_analysis":
        answer = ask_about_image(vlm, image_path, question) if image_path else "Please attach an image."
    elif intent == "camera_request":
        path = capture_camera()
        answer = ask_about_image(vlm, path, question) if path else "Camera not available."
    elif intent == "ask_time":
        answer = datetime.now().astimezone().strftime("It is %I:%M %p on %A, %B %d, %Y.")
    elif intent == "memory_write":
        long_memory.add(question)
        answer = "Got it, I'll remember that."
    else:                                   # chat, memory_read, web_search
        context = ""
        memories = long_memory.search(question)
        if memories:
            context += "Saved memories:\n" + "\n".join(memories) + "\n\n"
        if intent == "web_search":
            results = web_search(question)
            context += "Web results:\n" + "\n".join(f"- {r['title']} ({r['url']}): {r['snippet']}" for r in results)
        answer = ask(llm, f"{context}\nQuestion: {question}",
                     system=system_prompt("Use the context if relevant. Cite URLs when using web results."),
                     history=short_memory.messages())

    short_memory.add(question, answer)
    print("Assistant:", answer)
    return answer


chatbot("Remember that my favorite movie is Avengers: Endgame.")
chatbot("What is my favorite movie?")
chatbot("What is the current date and time?")
