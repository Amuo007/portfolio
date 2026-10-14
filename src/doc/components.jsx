import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import { GLOSSARY } from "./glossary";
import { BLOCKS, RECIPES, recipeScript, recipeLines, downloadRecipe } from "./snippets";
import { PageCtx, copyText, href } from "./util";

export function CopyButton({ text, label = "Copy", className = "", title }) {
  const [done, setDone] = useState(false);
  const click = async (e) => {
    e.stopPropagation();
    const value = typeof text === "function" ? text() : text;
    if (await copyText(value)) {
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    }
  };
  return (
    <button type="button" className={`btn ${className} ${done ? "is-done" : ""}`} onClick={click} title={title || label}>
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function Code({ code, lang = "python", title, maxLines = 30, note }) {
  const text = code.replace(/\n+$/, "");
  const lines = text.split("\n").length;
  const long = lines > maxLines + 6;
  const [open, setOpen] = useState(!long);
  const html = useMemo(() => {
    const grammar = Prism.languages[lang] || Prism.languages.python;
    return Prism.highlight(text, grammar, lang);
  }, [text, lang]);
  return (
    <div className="code">
      <div className="code-head">
        <span className="code-title">{title || (lang === "bash" ? "terminal" : "python")}</span>
        <span className="code-meta">{lines} lines</span>
        <CopyButton text={text + "\n"} label="Copy" className="btn-code" />
      </div>
      {note && <div className="code-note">{note}</div>}
      <pre className={`code-pre ${open ? "" : "is-collapsed"}`} style={open ? undefined : { maxHeight: `${maxLines * 1.6}em` }}>
        <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      {long && (
        <button type="button" className="code-more" onClick={() => setOpen(!open)}>
          {open ? "Show less" : `Show all ${lines} lines (Copy always copies everything)`}
        </button>
      )}
    </div>
  );
}

export function Block({ id, title, maxLines, note }) {
  const b = BLOCKS[id];
  return <Code code={b.code} title={title || b.title} maxLines={maxLines} note={note} />;
}

export function Term({ k, children }) {
  const entry = GLOSSARY[k];
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  useEffect(() => {
    if (!open) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setAlignRight(r.left + 320 > window.innerWidth);
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  if (!entry) return <>{children}</>;
  return (
    <span
      ref={ref}
      className="term"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen(true)}
    >
      {children || entry[0]}
      {open && (
        <span className={`term-pop ${alignRight ? "is-right" : ""}`} role="tooltip">
          <strong>{entry[0]}</strong>
          {entry[1]}
        </span>
      )}
    </span>
  );
}

export function Callout({ type = "tip", title, children }) {
  const icons = { tip: "✓", warn: "!", info: "i", exam: "★" };
  return (
    <div className={`callout callout-${type}`}>
      <span className="callout-icon" aria-hidden="true">{icons[type]}</span>
      <div>
        {title && <div className="callout-title">{title}</div>}
        <div className="callout-body">{children}</div>
      </div>
    </div>
  );
}

export function Table({ head, rows, className = "" }) {
  return (
    <div className="table-wrap">
      <table className={className}>
        {head && (
          <thead>
            <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// [name, plain meaning, values to try]
export function Settings({ rows }) {
  return (
    <Table
      className="settings"
      head={["Setting", "What it means (plain English)", "Try"]}
      rows={rows.map(([name, meaning, values]) => [<code key="n">{name}</code>, meaning, values])}
    />
  );
}

// [call, what it does, returns]
export function Fns({ rows }) {
  return (
    <Table
      className="fns"
      head={["Function", "What it does", "Gives back"]}
      rows={rows.map(([call, does, ret]) => [<code key="c">{call}</code>, does, ret])}
    />
  );
}

export function RecipeBar({ id, children }) {
  const r = RECIPES[id];
  return (
    <div className="recipe">
      <div className="recipe-top">
        <div>
          <div className="recipe-kicker">Full working script · tested</div>
          <div className="recipe-title">{r.title}</div>
          <div className="recipe-sub">
            {r.blocks.length} blocks · {recipeLines(id)} lines · paste into one cell or download the notebook
          </div>
        </div>
        <div className="recipe-actions">
          <CopyButton text={() => recipeScript(id)} label="Copy full script" className="btn-primary" />
          <button type="button" className="btn" onClick={() => downloadRecipe(id)}>Download .ipynb</button>
        </div>
      </div>
      <ol className="recipe-blocks">
        {r.blocks.map((b) => (
          <li key={b}>
            <a href={href(BLOCKS[b].page, "block-" + b)}>{BLOCKS[b].title}</a>
          </li>
        ))}
      </ol>
      {children && <div className="recipe-extra">{children}</div>}
    </div>
  );
}

export function H2({ id, children }) {
  const page = useContext(PageCtx);
  return (
    <h2 id={id} className="h2">
      <a className="anchor" href={href(page, id)} aria-hidden="true">#</a>
      {children}
    </h2>
  );
}

export function H3({ id, children }) {
  return <h3 id={id} className="h3">{children}</h3>;
}

export function QA({ q, children }) {
  return (
    <div className="qa">
      <div className="qa-q">{q}</div>
      <div className="qa-a">{children}</div>
    </div>
  );
}

const LIKELY = {
  most: ["Most likely", "b-most"],
  high: ["Likely", "b-high"],
  mid: ["Possible", "b-mid"],
  low: ["Unlikely", "b-low"],
};

export function Badge({ level }) {
  const [label, cls] = LIKELY[level];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PageHead({ kicker, title, likely, children }) {
  return (
    <header className="page-head">
      {kicker && <div className="page-kicker">{kicker}</div>}
      <h1>
        {title} {likely && <Badge level={likely} />}
      </h1>
      {children && <p className="lead">{children}</p>}
    </header>
  );
}

// "If the task says X -> change Y" rows: [ask, change]
export function Ifs({ rows }) {
  return (
    <Table className="ifs" head={["If the task says…", "Do this"]} rows={rows} />
  );
}

export function BlockSection({ id, title, children }) {
  return (
    <section className="block-sec" id={"block-" + id}>
      <h3 className="h3">{title || BLOCKS[id].title}</h3>
      {children}
    </section>
  );
}
