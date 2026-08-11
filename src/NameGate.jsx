import { useCallback, useEffect, useRef, useState } from "react";

export const NAME_KEY = "redflag-visitor-name";

// Escalating commentary as they keep failing to catch the skip button.
const TAUNTS = [
  "nope.",
  "not that one.",
  "it's faster than you.",
  "you're really committed to this, huh.",
  "that button has commitment issues.",
  "okay now it's just showing off. 😭",
  "I could genuinely do this all day.",
  "psst — literally type anything. I'm not picky.",
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

export default function NameGate({ onDone }) {
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
        trackEvent("Instagram Gate", "Skip Dodged", `dodge-${next}`);
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

    trackEvent("Instagram Gate", "Name Entered", `after-${dodges}-dodges`);
    setLeaving(true);

    // Let the exit animation play before handing the page over.
    setTimeout(() => onDone(trimmed), 420);
  };

  return (
    <div
      className={`gate-overlay ${leaving ? "is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Who's visiting?"
    >
      <div className="gate-card w-full max-w-sm rounded-3xl border border-white/10 bg-[#150a24]/95 p-6 text-center backdrop-blur-xl">
        <p className="text-5xl">🕵️</p>

        <h2 className="mt-3 text-2xl font-black leading-tight text-white">
          Hold on. Who is this?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-white/65">
          You came from my Instagram, wandered onto my secret page, and
          thought you'd stay anonymous?
        </p>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="visitor-name" className="sr-only">
            Your name
          </label>

          <input
            id="visitor-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 24))}
            placeholder="type your name…"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="go"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-lg font-semibold text-white placeholder:font-normal placeholder:text-white/30 focus:border-pink-400/60 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`press-dark mt-3 w-full rounded-2xl px-5 py-3.5 font-bold text-white ${
              canSubmit
                ? "play-glow bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600"
                : "cursor-not-allowed bg-white/10 text-white/40"
            }`}
          >
            {canSubmit ? `That's me — let me in →` : "That's me →"}
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
            className="runaway absolute whitespace-nowrap rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            I'll skip 🏃
          </button>
        </div>

        <p className="min-h-5 text-xs text-white/45">
          {dodges === 0
            ? "or skip — if you can catch it"
            : TAUNTS[Math.min(dodges - 1, TAUNTS.length - 1)]}
        </p>
      </div>
    </div>
  );
}
