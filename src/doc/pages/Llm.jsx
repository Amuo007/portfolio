import { Block, BlockSection, Callout, Code, Fns, H2, Ifs, PageHead, QA, RecipeBar, Table, Term } from "../components";
import { OriginalLinks } from "./Notebooks";

const INSTALL = `pip install langchain-core langchain-ollama                     # HW02 B, Harness
pip install langchain-community langchain-huggingface sentence-transformers faiss-cpu ddgs   # + HW07
ollama pull mistral
ollama pull llava`;

export default function Llm() {
  return (
    <>
      <PageHead kicker="HW02 Part B · HW-Harness · HW07" title="LLM & LangChain" likely="low">
        Local <Term k="llm">LLMs</Term> through <Term k="ollama">Ollama</Term>: ask questions, give the model{" "}
        <Term k="tool">tools</Term>, route by <Term k="intent">intent</Term>, add memory, web search and vision.
      </PageHead>

      <Callout type="info" title="Why this is marked unlikely">
        LangChain, Ollama and FAISS are not in the exam install list. <code>requests</code> is, and it can talk to Ollama
        directly, so that version comes first.
      </Callout>

      <H2 id="install">Install + start</H2>
      <Code code={INSTALL} lang="bash" title="terminal" />
      <p className="muted">Ollama must be running (open the app, or <code>ollama serve</code>). Check: <code>ollama list</code>.</p>

      <H2 id="requests">No LangChain: only requests</H2>
      <BlockSection id="llm_requests">
        <Fns
          rows={[
            ["ask(prompt, system, model, history)", "One question → answer text.", "string"],
            ["ask_json(prompt)", "Forces JSON output and returns a Python dict.", "dict / list"],
            ["ask_image(path, question)", <>Image + question to <Term k="llava">LLaVA</Term>.</>, "string"],
            ["system_prompt()", <>A <Term k="systemprompt">system prompt</Term> with today's date and time.</>, "string"],
          ]}
        />
        <Block id="llm_requests" />
      </BlockSection>

      <H2 id="langchain">LangChain versions</H2>
      <BlockSection id="llm_langchain">
        <Fns
          rows={[
            ["get_llm(model, temperature)", <>ChatOllama client. <Term k="temperature">temperature</Term> 0 = repeatable.</>, "LLM"],
            ["ask(llm, question, system, history)", "Question → answer (system prompt includes the time).", "string"],
            ["parse_json(text) / ask_json(llm, prompt)", "Pull JSON out of a reply.", "dict / list"],
          ]}
        />
        <Block id="llm_langchain" />
      </BlockSection>

      <BlockSection id="llm_tools">
        <p>HW02 B: Mistral can't know the time. Fix: a tool. <code>@tool</code> + a docstring is all it takes.</p>
        <Block id="llm_tools" />
      </BlockSection>

      <RecipeBar id="llm_harness" />
      <BlockSection id="llm_intents">
        <p>
          The original Harness notebook scored 20% because Mistral's replies ("Intent: ask_time.") never matched exactly, so
          everything fell back to chat. This version searches the reply for an intent name and handles "remember…" and
          images by rule first: 91.7% on the same test set.
        </p>
        <Block id="llm_intents" />
      </BlockSection>

      <RecipeBar id="llm_chatbot" />
      <BlockSection id="llm_chatbot">
        <Fns
          rows={[
            ["ShortMemory(turns=5)", "Last 5 question/answer turns (forgotten on restart).", ".add, .messages, .clear"],
            ["LongMemory(path)", <><Term k="faiss">FAISS</Term> vector store on disk, searched by meaning (<Term k="embedding">embeddings</Term>).</>, ".add, .search, .clear"],
            ["web_search(query)", "DuckDuckGo results, no API key.", "[{title, url, snippet}]"],
            ["capture_camera()", "One webcam photo (macOS asks for permission).", "path or None"],
            ["chatbot(question, image_path)", "Intent → tool/memory/web → answer → remember.", "string"],
          ]}
        />
        <Block id="llm_chatbot" />
      </BlockSection>

      <H2 id="bugs">Bugs in the original notebooks</H2>
      <Table
        head={["Notebook", "Problem", "Fix"]}
        rows={[
          ["HW02 Part B, cell 9", <><code>llm_with_tools</code> is used but never defined in the saved notebook.</>, <code>llm_with_tools = ChatOllama(model="mistral").bind_tools([get_current_time])</code>],
          ["HW-Harness, Basic Tools", <><code>memory = {'{""}'}</code> is a set, so <code>memory[key] = value</code> crashes.</>, <code>memory = {"{}"}</code>],
          ["HW-Harness, classify_intent", "Exact-match check: any extra word → \"chat\" (20% accuracy).", "Use the Intent router block"],
        ]}
      />

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Use a different model", <><code>get_llm("qwen2.5:14b")</code> or <code>MODEL = "llama3.2:1b"</code> (anything in <code>ollama list</code>)</>],
          ["Add a new intent", "Add a line to INTENTS, then an elif branch in chatbot()"],
          ["Add a new tool", <>Write a function with <code>@tool</code> and a docstring; pass it in the tools list</>],
          ["Remember more turns", <code>ShortMemory(turns=10)</code>],
          ["More memories per answer", <code>long_memory.search(question, k=5)</code>],
        ]}
      />

      <H2 id="theory">Theory answers</H2>
      <QA q="Why did Mistral give a wrong answer about the time? How do you fix it?">
        An LLM only knows its training data; it has no clock or internet. Fix: give it the information. Either put the
        current date/time into the system prompt, or provide a tool (a function with a description of what it does, its
        arguments and what it returns) that the model can ask to call, e.g. <code>get_current_time()</code> via LangChain
        tools or MCP.
      </QA>
      <QA q="What is intent classification and why use it?">
        Deciding what the user wants (chat, time, save/read memory, web search, camera, image) before answering, so a
        router can call the right tool. Measure it like any classifier: accuracy and a confusion matrix on labeled test
        messages.
      </QA>
      <QA q="Short-term vs long-term memory?">
        Short-term: the last few turns, sent with every request, lost on restart. Long-term: facts stored as embeddings
        in a vector store (FAISS) on disk, searched by meaning and reloaded after a restart.
      </QA>
      <QA q="When should the chatbot search the web?">
        When the question needs current or changing information beyond the model's knowledge cutoff (news, prices,
        weather, "latest", years after the cutoff), and saved memory cannot answer it.
      </QA>

      <OriginalLinks topic="llm" />
    </>
  );
}
