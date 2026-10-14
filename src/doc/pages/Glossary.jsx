import { useEffect, useState } from "react";
import { PageHead } from "../components";
import { GLOSSARY } from "../glossary";

export default function Glossary({ sub }) {
  const [q, setQ] = useState("");
  const entries = Object.entries(GLOSSARY).sort((a, b) => a[1][0].localeCompare(b[1][0]));
  const shown = entries.filter(([, [term, def]]) => (term + " " + def).toLowerCase().includes(q.toLowerCase()));
  useEffect(() => {
    if (sub) document.getElementById("g-" + sub)?.classList.add("is-flash");
  }, [sub]);
  return (
    <>
      <PageHead kicker="Reference" title="Glossary">
        Every technical word on this site in plain English. The same text appears when you hover a dotted word.
      </PageHead>
      <input
        className="filter"
        type="search"
        placeholder={`Filter ${entries.length} words…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Filter glossary"
      />
      <dl className="glossary">
        {shown.map(([k, [term, def]]) => (
          <div key={k} id={"g-" + k} className="g-item">
            <dt>{term}</dt>
            <dd>{def}</dd>
          </div>
        ))}
      </dl>
      {!shown.length && <p className="muted">No match.</p>}
    </>
  );
}
