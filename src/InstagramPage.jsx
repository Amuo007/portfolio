import { useCallback, useEffect, useRef, useState } from "react";
import { createHeroBackground } from "./instagram-bg";
import GameCanvas from "./GameCanvas";
import { GOAL_SCORE, UNLOCK_KEY } from "./instagram-game";

// This page is intentionally unlisted — nothing on the main site links to
// it. It exists only for people who tap the link in my Instagram bio.

// Put your Instagram profile URL here so the "sneak back" button lands on
// your page instead of the generic feed.
const INSTAGRAM_URL = "https://www.instagram.com/";

const FACES = ["👀", "🕵️", "😏", "🫣", "😳", "🥸", "😇"];

const TAP_LINES = [
  "yes… I can see you tapping.",
  "still going, huh?",
  "that emoji has feelings, you know.",
  "achievement unlocked: absolutely nothing 🏆",
  "okay you can stop now 😭",
  "fine — you win. favorite visitor ever 🏅",
];

const SCAN_STATS = [
  { label: "Curiosity level", value: 97, note: "dangerously high" },
  { label: "Self-control", value: 8, note: "the link was right there" },
  { label: "Vibe check", value: 100, note: "passed, obviously" },
];

const trackEvent = (category, action, name) => {
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(["trackEvent", category, action, name]);
  }
};

// Fades content in when it scrolls into view (same idea as the portfolio).
const Reveal = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={`srv ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

// 3D-ish tilt that follows the pointer (desktop only — touch gets a
// gentle idle float instead via CSS).
const TiltCard = ({ children, className = "", style }) => {
  const ref = useRef(null);

  const handleMove = (event) => {
    if (event.pointerType === "touch") return;

    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    el.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(x * 12).toFixed(2)}deg`);
  };

  const handleLeave = () => {
    const el = ref.current;

    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default function InstagramPage() {
  const [taps, setTaps] = useState(0);
  const bgCanvasRef = useRef(null);

  // The portfolio link stays locked until they beat Red Flag Run once.
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });

  const handleUnlock = useCallback(() => setUnlocked(true), []);

  useEffect(() => {
    const bg = createHeroBackground(bgCanvasRef.current);

    return () => bg.destroy();
  }, []);

  const face = FACES[taps % FACES.length];
  const tapLine =
    taps === 0
      ? "psst — try tapping the face"
      : TAP_LINES[Math.min(taps - 1, TAP_LINES.length - 1)];

  const handleFaceTap = () => {
    setTaps((count) => count + 1);
    trackEvent("Instagram Page", "Face Tap", `tap-${taps + 1}`);
  };

  const scrollToGame = () => {
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
    trackEvent("Instagram Page", "Click", "Scroll To Game");
  };

  return (
    <div className="relative bg-[#0b0b13] text-white">
      {/* ---- Hero ---- */}
      <section className="relative min-h-svh overflow-hidden">
        <canvas
          ref={bgCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0b13]"
        />

        <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-5 py-14 text-center">
          <p
            className="pop rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 backdrop-blur-sm"
            style={{ "--pop-delay": "0ms" }}
          >
            🤫 unlisted page · you found it
          </p>

          <button
            type="button"
            onClick={handleFaceTap}
            aria-label="Mystery face — tap it"
            className="pop mt-7 select-none rounded-full"
            style={{ "--pop-delay": "80ms" }}
          >
            <span key={taps} className="face text-7xl">
              {face}
            </span>
          </button>

          <p className="mt-2 min-h-4 text-xs text-white/40">{tapLine}</p>

          <h1
            className="pop mt-5 text-4xl font-extrabold leading-tight sm:text-5xl"
            style={{ "--pop-delay": "160ms" }}
          >
            Well, well, well…
          </h1>

          <p
            className="pop shimmer-text mt-2 bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
            style={{ "--pop-delay": "280ms" }}
          >
            look who slid out of Instagram 👀
          </p>

          <p
            className="pop mt-4 max-w-sm text-base leading-relaxed text-white/70"
            style={{ "--pop-delay": "400ms" }}
          >
            Which wandering soul do we have here? One second you were
            doom-scrolling, and now you're snooping around my secret page.
          </p>

          <TiltCard
            className="pop mt-7 w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md"
            style={{ "--pop-delay": "520ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Visitor scan
              </p>

              <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-300">
                <span className="live-dot" /> live
              </span>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-white/60">Source</span>

              <span className="rounded-full border border-pink-400/30 bg-gradient-to-r from-amber-400/20 via-pink-500/20 to-purple-600/20 px-2.5 py-0.5 text-xs font-semibold text-pink-200">
                Instagram bio link
              </span>
            </div>

            {SCAN_STATS.map((stat, index) => (
              <div key={stat.label} className="mb-3.5 last:mb-0">
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-white/80">{stat.label}</span>
                  <span className="text-xs text-white/45">{stat.note}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="scan-bar h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600"
                      style={{
                        width: `${stat.value}%`,
                        "--bar-delay": `${700 + index * 220}ms`,
                      }}
                    />
                  </div>

                  <span className="w-9 text-right text-xs font-semibold text-white/80">
                    {stat.value}%
                  </span>
                </div>
              </div>
            ))}

            <p className="mt-4 border-t border-white/10 pt-3.5 text-sm leading-relaxed text-white/70">
              Verdict:{" "}
              <span className="font-semibold text-white">
                certified wandering soul
              </span>{" "}
              ✅ — saw a mysterious link, pressed it without hesitation.
              Honestly? Respect.
            </p>
          </TiltCard>

          <button
            type="button"
            onClick={scrollToGame}
            className="pop scroll-cue mt-9 flex flex-col items-center gap-1 text-sm font-semibold text-white/60"
            style={{ "--pop-delay": "760ms" }}
          >
            <span>psst… I hid a game down here 🎮</span>
            <span className="text-xl">👇</span>
          </button>
        </div>
      </section>

      {/* ---- Game ---- */}
      <section id="game" className="relative mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <Reveal className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-300">
            Prove you're not just a lurker
          </p>

          <h2 className="shimmer-text mt-2 bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
            RED FLAG RUN
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            My gift to you, nosy one: a tiny arcade. Collect the likes, dodge
            the red flags, and try to beat your own high score before your
            thumb gets tired.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <GameCanvas onUnlock={handleUnlock} />
        </Reveal>
      </section>

      {/* ---- Outro ---- */}
      <section className="relative mx-auto w-full max-w-md px-5 pb-14">
        <Reveal className="flex w-full flex-col gap-3">
          {unlocked ? (
            <a
              href="../"
              onClick={() =>
                trackEvent("Instagram Page", "Click", "To Portfolio")
              }
              className="press-dark unlock-pop w-full rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-5 py-3.5 text-center font-semibold text-white shadow-lg shadow-pink-500/25"
            >
              Okay fine — see what I actually build →
            </a>
          ) : (
            <button
              type="button"
              onClick={scrollToGame}
              className="press-dark w-full cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-3.5 text-center font-semibold text-white/45"
            >
              🔒 Locked — score {GOAL_SCORE} in Red Flag Run to see my work
            </button>
          )}

          <a
            href={INSTAGRAM_URL}
            onClick={() =>
              trackEvent("Instagram Page", "Click", "Back to Instagram")
            }
            className="press-dark w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-center font-semibold text-white/85 backdrop-blur"
          >
            🏃 Sneak back to Instagram
          </a>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-8 text-center text-xs leading-relaxed text-white/35">
            Yes — I built a whole secret page (and a video game) just to catch
            you snooping.
            <br />
            No buttons lead here. Only the chosen ones with the bio link 🤝
          </p>
        </Reveal>
      </section>
    </div>
  );
}
