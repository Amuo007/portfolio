import { useCallback, useEffect, useRef, useState } from "react";

export const VISITOR_NAME_KEY = "portfolio-visitor-name";

const VISITOR_WEBHOOK_URL =
  "https://n8n.quite-home.com/webhook/portfolio-visitor";

// Escalating commentary as they keep failing to catch the skip button.
// Same gag as the Instagram gate, in business casual.
const TAUNTS = [
  "Regrettably, the skip option has declined.",
  "The button appears to be unavailable at this time.",
  "Please hold — it keeps moving. Curious.",
  "Per site policy, that button cannot be caught.",
  "Your persistence has been noted. And admired.",
  "The button has requested a restraining order.",
  "Management apologizes for the inconvenience. (It doesn't.)",
  "May I suggest the name field? It's significantly slower.",
];

const trackEvent = (category, action, name) => {
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(["trackEvent", category, action, name]);
  }
};

// Somewhere new inside the arena, and far enough from where it just was
// that the move is obvious.
const flee = (from) => {
  for (let i = 0; i < 12; i += 1) {
    const x = 14 + Math.random() * 72;
    const y = 20 + Math.random() * 60;

    if (Math.hypot(x - from.x, y - from.y) > 34) return { x, y };
  }

  return { x: 100 - from.x, y: 100 - from.y };
};

export default function PortfolioGate({ onDone }) {
  const [name, setName] = useState("");
  const [dodges, setDodges] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 45 });
  const [leaving, setLeaving] = useState(false);

  const arenaRef = useRef(null);
  const skipRef = useRef(null);
  const lastCountedRef = useRef(0);

  // Always reposition, but only advance the taunt every so often — a
  // single press fires both pointerdown and click, and sweeping the
  // cursor past it fires a burst of proximity flees.
  const dodge = useCallback(() => {
    setPos((current) => flee(current));

    const now = performance.now();

    if (now - lastCountedRef.current < 320) return;

    lastCountedRef.current = now;

    setDodges((count) => {
      const next = count + 1;

      if (next === 1 || next === 5 || next === 10) {
        trackEvent("Main Gate", "Skip Dodged", `dodge-${next}`);
      }

      return next;
    });
  }, []);

  // Flee on approach, so on desktop it bolts before the cursor arrives.
  useEffect(() => {
    const arena = arenaRef.current;

    if (!arena) return undefined;

    const onMove = (event) => {
      const button = skipRef.current;

      if (!button) return;

      const rect = button.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      if (Math.hypot(event.clientX - cx, event.clientY - cy) < 78) dodge();
    };

    arena.addEventListener("pointermove", onMove);

    return () => arena.removeEventListener("pointermove", onMove);
  }, [dodge]);

  // Keep the page itself from scrolling while the gate is up.
  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2;

  const submit = (event) => {
    event.preventDefault();

    if (!canSubmit || leaving) return;

    trackEvent("Main Gate", "Name Entered", `after-${dodges}-dodges`);

    try {
      localStorage.setItem(VISITOR_NAME_KEY, trimmed);
    } catch {
      // Storage unavailable — they just meet the gate again next visit.
    }

    // Fire-and-forget: never make the visitor wait on the webhook.
    fetch(VISITOR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    }).catch(() => {});

    setLeaving(true);

    // Let the exit animation play before handing the page over.
    setTimeout(() => onDone(trimmed), 420);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Who's visiting?"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-md transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl">
        <p className="text-5xl">🤝</p>

        <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900">
          Before you proceed — a quick formality.
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Welcome to my portfolio. May I ask who&apos;s visiting? Guest access
          is available via the skip button below. Results may vary.
        </p>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="gate-visitor-name" className="sr-only">
            Your name
          </label>

          <input
            id="gate-visitor-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 24))}
            placeholder="type your name…"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="go"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-lg font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`press mt-3 w-full rounded-xl px-5 py-3.5 font-bold text-white ${
              canSubmit
                ? "bg-slate-900 hover:bg-slate-700"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {canSubmit ? "Nice to meet you →" : "Continue →"}
          </button>
        </form>

        {/* The escape hatch that isn't. It bolts on hover, on touch, and
            on any attempt to press it, so a name is the only way through. */}
        <div
          ref={arenaRef}
          className="relative mt-3 h-28 select-none"
          style={{ touchAction: "none" }}
        >
          <button
            ref={skipRef}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onPointerDown={(event) => {
              event.preventDefault();
              dodge();
            }}
            onPointerEnter={dodge}
            onClick={dodge}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transition: "left 180ms ease-out, top 180ms ease-out",
            }}
          >
            Skip introductions 🏃
          </button>
        </div>

        <p className="min-h-5 text-xs text-gray-400">
          {dodges === 0
            ? "or skip the formality — if you can"
            : TAUNTS[Math.min(dodges - 1, TAUNTS.length - 1)]}
        </p>
      </div>
    </div>
  );
}
