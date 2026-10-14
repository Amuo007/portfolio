import { Fragment, useEffect, useState } from "react";
import { Callout, Code, CopyButton, H2, PageHead } from "../components";
import { href } from "../util";
import { downloadNotebook } from "../snippets";
import INDEX from "../data/notebooks/index.json";
import { TRY2, loadTry2 } from "../ai";

const loaders = import.meta.glob("../data/notebooks/*.json");
const load = (id) => (id === TRY2.id ? loadTry2() : loaders[`../data/notebooks/${id}.json`]().then((m) => m.default));

// "HW2 try 2" (the "&" chat) sits right after HW02 Part B.
const at = INDEX.findIndex((n) => n.id === "hw02b") + 1;
const LIST = [...INDEX.slice(0, at), TRY2, ...INDEX.slice(at)];
const cellCount = (n) => (n.id === TRY2.id ? "AI chat" : `${n.n} cells`);

const TOPIC_PAGE = { image: "images", llm: "llm", transfer: "transfer", cnn: "cnn", keras: "keras", binary: "binary" };

// Tiny markdown renderer: headings, bold, italics, inline code, lists, paragraphs.
function inline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Markdown({ text }) {
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  text.split("\n").forEach((line) => {
    const t = line.trim();
    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const Tag = `h${Math.min(h[1].length + 2, 6)}`;
      out.push(<Tag key={out.length} className="md-h">{inline(h[2])}</Tag>);
    } else if (/^[-*•]\s+/.test(t)) {
      list.push(t.replace(/^[-*•]\s+/, ""));
    } else if (t) {
      flush();
      out.push(<p key={out.length}>{inline(t)}</p>);
    } else {
      flush();
    }
  });
  flush();
  return <div className="md">{out}</div>;
}

export function OriginalLinks({ topic }) {
  const list = LIST.filter((n) => n.topic === topic);
  if (!list.length) return null;
  return (
    <>
      <H2 id="originals">Your original notebooks</H2>
      <p className="muted">Exactly as submitted, every cell copyable, downloadable as a clean .ipynb.</p>
      <div className="cards cards-small">
        {list.map((n) => (
          <a key={n.id} className="card" href={href("notebooks", n.id)}>
            <div className="card-title">{n.title}</div>
            <div className="card-why">{n.desc}</div>
            <div className="card-hw">{cellCount(n)} · {n.file}</div>
          </a>
        ))}
      </div>
    </>
  );
}

function Viewer({ id }) {
  const meta = LIST.find((n) => n.id === id);
  const [nb, setNb] = useState(null);
  const [error, setError] = useState("");
  const known = Boolean(meta);
  useEffect(() => {
    const refresh = () => {
      setError("");
      load(id).then(setNb).catch((e) => setError(e.message));
    };
    setNb(null);
    if (!known) return;
    refresh();
    window.addEventListener("try2-updated", refresh);   // a new & answer arrived
    return () => window.removeEventListener("try2-updated", refresh);
  }, [id, known]);
  if (!meta) return <p>Notebook not found. <a href={href("notebooks")}>All notebooks</a></p>;
  const codeCells = nb ? nb.cells.filter((c) => c.t === "code") : [];
  const allCode = () => codeCells.map((c) => c.s).join("\n\n");
  const download = () =>
    downloadNotebook(id === TRY2.id ? "HW2_try_2.ipynb" : meta.file.replace(/\s+/g, "_"), nb.cells.map((c) => ({ type: c.t === "md" ? "md" : "code", text: c.s })));
  let n = 0;
  return (
    <>
      <PageHead kicker={<a href={href("notebooks")}>← All notebooks</a>} title={meta.title}>
        {meta.desc}
      </PageHead>
      <div className="nb-bar">
        <span className="muted">{meta.file} · {nb ? nb.cells.length : meta.n} cells{TOPIC_PAGE[meta.topic] && <> · cleaned-up version on the <a href={href(TOPIC_PAGE[meta.topic])}>topic page</a></>}</span>
        <span className="nb-actions">
          {nb && <CopyButton text={allCode} label={`Copy all ${codeCells.length} code cells`} className="btn-primary" />}
          {nb && <button type="button" className="btn" onClick={download}>Download .ipynb</button>}
        </span>
      </div>
      {!nb && <p className="muted">{error || "Loading…"}</p>}
      {nb && !nb.cells.length && <p className="muted">Empty so far: open search, type a question ending in &amp;, press Enter.</p>}
      {nb &&
        nb.cells.map((c, i) =>
          c.t === "md" ? (
            <div key={i} className={c.ai ? "is-ai" : undefined}>
              {c.ai && <span className="ai-tag">AI</span>}
              <Markdown text={c.s} />
            </div>
          ) : (
            <div className="nb-cell" key={i}>
              <Code code={c.s} title={`In [${++n}]${c.ai ? " · AI" : ""}`} maxLines={40} />
              {(c.o || c.fig) && (
                <div className="nb-out">
                  {c.o && <pre>{c.o}</pre>}
                  {c.fig && <div className="nb-fig">[plot / image output]</div>}
                </div>
              )}
            </div>
          )
        )}
    </>
  );
}

export default function Notebooks({ sub }) {
  if (sub) return <Viewer id={sub} />;
  return (
    <>
      <PageHead kicker="Reference" title="Original notebooks">
        Your homework notebooks exactly as submitted (outputs shortened, plots marked). Use these when you want the
        original code line for line; use the topic pages for the cleaned-up, plug-and-play versions.
      </PageHead>
      <Callout type="tip">
        Each notebook can be downloaded as a clean <code>.ipynb</code> (no outputs) and run again.
      </Callout>
      <div className="nb-list">
        {LIST.map((n) => (
          <a key={n.id} className="nb-row" href={href("notebooks", n.id)}>
            <span className="nb-title">{n.title}</span>
            <span className="nb-desc">{n.desc}</span>
            <span className="nb-n">{cellCount(n)}</span>
          </a>
        ))}
      </div>
    </>
  );
}
