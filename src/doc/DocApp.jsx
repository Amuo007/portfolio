import { useCallback, useEffect, useState } from "react";
import { PAGES } from "./pageMeta";
import { PageCtx, href } from "./util";
import { search } from "./search";
import { ask, clearTry2 } from "./ai";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import Transfer from "./pages/Transfer";
import Binary from "./pages/Binary";
import Cnn from "./pages/Cnn";
import Augment from "./pages/Augment";
import Keras from "./pages/Keras";
import Images from "./pages/Images";
import Llm from "./pages/Llm";
import Notebooks from "./pages/Notebooks";
import Fixes from "./pages/Fixes";
import Glossary from "./pages/Glossary";

const COMPONENTS = { home: Home, setup: Setup, transfer: Transfer, binary: Binary, cnn: Cnn, augment: Augment, keras: Keras, images: Images, llm: Llm, notebooks: Notebooks, fixes: Fixes, glossary: Glossary };

function parseHash() {
  const [page, ...rest] = location.hash.replace(/^#\/?/, "").split("/");
  return { page: COMPONENTS[page] ? page : "home", sub: decodeURIComponent(rest.join("/")) || "" };
}

function getStored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function setStored(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

function useTheme() {
  const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const [theme, setTheme] = useState(() => getStored("doc-theme") || (systemDark() ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setStored("doc-theme", next);
    setTheme(next);
  };
  return [theme, toggle];
}

// Mounted fresh on every open, so it always starts empty and focused (no lost keystrokes).
function Search({ open, onClose }) {
  return open ? <SearchDialog onClose={onClose} /> : null;
}

function SearchDialog({ onClose }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const clearQ = q.trim().endsWith("&&");                                            // "&&" -> clear the chat
  const aiQ = !clearQ && q.trim().endsWith("&") ? q.trim().slice(0, -1).trim() : null;   // "question &" -> Lemonade
  const results = aiQ === null && !clearQ ? search(q) : [];
  const go = (r) => {
    location.hash = href(r.to[0], r.to[1]);
    onClose();
  };
  const sendToAi = async () => {
    if (!aiQ || status === "busy") return;
    setStatus("busy");
    try {
      await ask(aiQ);
      location.hash = href("notebooks", "hw2-try-2");
      window.dispatchEvent(new Event("try2-updated"));
      onClose();
    } catch (error) {
      setStatus(error.message);
    }
  };
  const clearSession = () => {
    clearTry2();
    if (location.hash.includes("hw2-try-2")) location.hash = href("notebooks");
    window.dispatchEvent(new Event("try2-updated"));
    onClose();
  };
  const onKey = (e) => {
    if (e.key === "Enter" && clearQ) { e.preventDefault(); clearSession(); }
    else if (e.key === "Enter" && aiQ !== null) { e.preventDefault(); sendToAi(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) go(results[active]);
    else if (e.key === "Escape") onClose();
  };
  return (
    <div className="search-backdrop" onMouseDown={onClose}>
      <div className="search" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={onKey}
          placeholder="Search tasks, functions, settings, words…  (try: confusion, freeze, batch size)"
          aria-label="Search"
        />
        <div className="search-results">
          {aiQ !== null && (
            <button type="button" className="search-item is-active" onClick={sendToAi} disabled={status === "busy"}>
              <span className="search-type">Ask AI</span>
              <span className="search-title">{status === "busy" ? "Thinking… (answer goes to HW2 try 2)" : aiQ || "Type a question before the &"}</span>
              <span className="search-sub">{status && status !== "busy" ? status : "Enter = ask · same chat every time · answer becomes cells in HW2 try 2"}</span>
            </button>
          )}
          {clearQ && (
            <button type="button" className="search-item is-active" onClick={clearSession}>
              <span className="search-type">Clear</span>
              <span className="search-title">Delete the HW2 try 2 session</span>
              <span className="search-sub">Enter = clear the whole chat · the next "&amp;" starts a new one</span>
            </button>
          )}
          {q && aiQ === null && !clearQ && !results.length && <div className="search-empty">No results for "{q}"</div>}
          {!q && (
            <div className="search-empty">
              Type a task ("roc curve"), a function ("train_model"), a setting ("EPOCHS") or a word ("dropout").
            </div>
          )}
          {results.map((r, i) => (
            <button
              type="button"
              key={i}
              className={`search-item ${i === active ? "is-active" : ""}`}
              onMouseMove={() => i !== active && setActive(i)}
              onClick={() => go(r)}
            >
              <span className="search-type">{r.type}</span>
              <span className="search-title">{r.title}</span>
              <span className="search-sub">{r.sub}</span>
            </button>
          ))}
        </div>
        <div className="search-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function Toc({ route }) {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      const hs = [...document.querySelectorAll(".content h2[id]")];
      setItems(hs.map((h) => ({ id: h.id, text: h.textContent.replace(/^#/, "") })));
    }, 50);
    return () => clearTimeout(t);
  }, [route.page, route.sub]);
  useEffect(() => {
    if (!items.length) return;
    const onScroll = () => {
      let cur = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top < 120) cur = it.id;
      }
      setCurrent(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);
  if (items.length < 2) return <aside className="toc" />;
  return (
    <aside className="toc">
      <div className="toc-label">On this page</div>
      {items.map((it) => (
        <a key={it.id} href={href(route.page, it.id)} className={it.id === current ? "is-current" : ""}>
          {it.text}
        </a>
      ))}
    </aside>
  );
}

export default function DocApp() {
  const [route, setRoute] = useState(parseHash);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // After a route change: jump to the anchor (or the top) and close the mobile menu.
  useEffect(() => {
    setNavOpen(false);
    const page = PAGES.find((p) => p.id === route.page);
    document.title = `${page?.title || "Docs"} · Code Docs`;
    const t = setTimeout(() => {
      const s = route.sub;
      const el = s && (document.getElementById(s) || document.getElementById("block-" + s) || document.getElementById("g-" + s));
      if (el) el.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    }, 30);
    return () => clearTimeout(t);
  }, [route.page, route.sub]);

  const onKey = useCallback((e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    } else if (e.key === "/" && !typing) {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const Page = COMPONENTS[route.page];
  const groups = [...new Set(PAGES.map((p) => p.group))];
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <div className={`doc ${navOpen ? "nav-open" : ""}`}>
      <header className="topbar">
        <button type="button" className="icon-btn nav-toggle" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <a className="brand" href={href("home")}>
          <span className="brand-mark" aria-hidden="true">{"{ }"}</span>
          <span className="brand-name">Code Docs</span>
          <span className="brand-sub">Physical Computing</span>
        </a>
        <button type="button" className="search-btn" onClick={() => setSearchOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span>Search</span>
          <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
          {theme === "dark" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
          )}
        </button>
      </header>

      <nav className="sidebar" aria-label="Pages">
        {groups.map((g) => (
          <div key={g} className="nav-group">
            <div className="nav-label">{g === "Topics" ? "Topics · most likely first" : g}</div>
            {PAGES.filter((p) => p.group === g).map((p) => (
              <a key={p.id} href={href(p.id)} className={`nav-item ${route.page === p.id ? "is-active" : ""}`}>
                {p.likely && <span className={`dot d-${p.likely}`} aria-hidden="true" />}
                <span className="nav-title">{p.nav || p.title}</span>
                {p.tag && <span className="nav-hw">{p.tag}</span>}
              </a>
            ))}
          </div>
        ))}
        <div className="nav-legend">
          <span><i className="dot d-most" /> most likely</span>
          <span><i className="dot d-high" /> likely</span>
          <span><i className="dot d-mid" /> possible</span>
          <span><i className="dot d-low" /> unlikely</span>
        </div>
      </nav>
      <div className="scrim" onClick={() => setNavOpen(false)} />

      <main className="content">
        <PageCtx.Provider value={route.page}>
          <Page sub={route.sub} key={route.page + (route.page === "notebooks" ? route.sub : "")} />
        </PageCtx.Provider>
        <footer className="foot">Code from the course notebooks · every script tested in the exam environment (Python 3.12, torch 2.14, TF 2.21, albumentations 2.0)</footer>
      </main>
      <Toc route={route} />

      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
