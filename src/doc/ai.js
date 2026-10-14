// "question &" in search -> Lemonade on the local network. Works when the site runs locally
// (npm run dev): Lemonade only accepts requests from localhost. The chat and the
// "HW2 try 2" cells are kept in this browser's localStorage.
const BASE_URL = "http://192.168.1.252:13305/v1";
const MODEL = "Qwen3.8-Flash-Next-GGUF-IQ4_NL";
const KEY = "doc-try2";
const SYSTEM =
  "You help with a Physical Computing course: OpenCV, PyTorch CNNs, transfer learning, Keras, " +
  "classification metrics, augmentation. Answer like a Jupyter notebook: short explanations in " +
  "markdown, and complete runnable Python in ```python code blocks.";

export const TRY2 = { id: "hw2-try-2", title: "HW2 try 2", desc: "Type a question ending in & in search", file: MODEL, topic: "llm" };

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { messages: [], cells: [] };
  } catch {
    return { messages: [], cells: [] };
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* storage blocked */ }
}

// Markdown answer -> cells: ```python blocks become code cells, everything else markdown.
function toCells(text) {
  const cells = [];
  let last = 0;
  for (const m of text.matchAll(/```(\w*)\n([\s\S]*?)```/g)) {
    const before = text.slice(last, m.index).trim();
    if (before) cells.push({ type: "md", source: before });
    const isPython = ["", "python", "py"].includes(m[1].toLowerCase());
    cells.push(isPython ? { type: "code", source: m[2].trimEnd() } : { type: "md", source: m[0] });
    last = m.index + m[0].length;
  }
  const rest = text.slice(last).trim();
  if (rest) cells.push({ type: "md", source: rest });
  return cells;
}

export async function ask(prompt) {
  const state = load();
  const messages = [...state.messages, { role: "user", content: prompt }];
  let res;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: SYSTEM }, ...messages] }),
    });
  } catch {
    throw new Error("Can't reach Lemonade. Run the site locally (npm run dev) on the same network as the server.");
  }
  if (!res.ok) throw new Error(`Lemonade error ${res.status}`);
  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  state.messages = [...messages, { role: "assistant", content: text }];
  state.cells = [...state.cells, { type: "md", source: `**Q:** ${prompt}` }, ...toCells(text).map((c) => ({ ...c, ai: true }))];
  save(state);
}

// Same shape as the original notebooks: { t: "md" | "code", s: source, ai }
export async function loadTry2() {
  return { ...TRY2, cells: load().cells.map((c) => ({ t: c.type, s: c.source, ai: c.ai })) };
}
