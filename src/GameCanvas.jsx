import { useEffect, useRef, useState } from "react";
import { RedFlagRun, GOAL_SCORE } from "./instagram-game";

const PORTFOLIO_URL = "../";
const REDIRECT_SECONDS = 6;

const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

const verdictFor = (score) => {
  if (score < 200) {
    return "Self-control: 8%. Reflexes: apparently also 8%.";
  }

  if (score < GOAL_SCORE) {
    return "So close. The gate doesn't open for almost. 😌";
  }

  if (score < 1200) {
    return "Okay lurker, you've actually got hands. 👐";
  }

  return "Certified menace. The red flags fear you. 🏆";
};

const trackEvent = (category, action, name) => {
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(["trackEvent", category, action, name]);
  }
};

export default function GameCanvas({ onUnlock }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const [phase, setPhase] = useState("idle");
  const [hud, setHud] = useState({
    score: 0,
    hearts: 0,
    best: 0,
    goalProgress: 0,
    clearedGoal: false,
  });
  const [countdown, setCountdown] = useState(null);
  const [overStats, setOverStats] = useState(null);
  const [muted, setMuted] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [redirectIn, setRedirectIn] = useState(null);

  useEffect(() => {
    const game = new RedFlagRun(canvasRef.current, wrapRef.current, {
      onHud: setHud,
      onCountdown: (n) => {
        setCountdown(n);

        if (n === 0) {
          setPhase("running");
          setTimeout(() => setCountdown(null), 700);
        }
      },
      onGameOver: (stats) => {
        setOverStats(stats);
        setPhase("over");
        trackEvent("Instagram Game", "Game Over", `score-${stats.score}`);

        if (stats.everUnlocked) setRedirectIn(REDIRECT_SECONDS);
      },
      onUnlock: () => {
        setShowUnlockToast(true);
        setTimeout(() => setShowUnlockToast(false), 3600);
        onUnlock?.();
        trackEvent("Instagram Game", "Goal Cleared", "Portfolio Unlocked");
      },
    });

    gameRef.current = game;

    // Pause the whole simulation when the game scrolls out of view.
    let observer;

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          game.setPaused(!entries.some((entry) => entry.isIntersecting));
        },
        { threshold: 0.05 }
      );

      observer.observe(wrapRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      game.destroy();
      gameRef.current = null;
    };
  }, [onUnlock]);

  // Ticks the "taking you to the portfolio" countdown on the win screen.
  useEffect(() => {
    if (redirectIn === null) return undefined;

    if (redirectIn <= 0) {
      trackEvent("Instagram Game", "Click", "Auto Redirect To Portfolio");
      window.location.href = PORTFOLIO_URL;
      return undefined;
    }

    const timer = setTimeout(() => setRedirectIn((n) => n - 1), 1000);

    return () => clearTimeout(timer);
  }, [redirectIn]);

  const startGame = () => {
    setOverStats(null);
    setRedirectIn(null);
    setPhase("countdown");
    gameRef.current?.start();
    trackEvent("Instagram Game", "Start", "Red Flag Run");
  };

  const toggleMute = () => {
    setMuted((current) => {
      gameRef.current?.setMuted(!current);
      return !current;
    });
  };

  const inPlay = phase === "running" || phase === "countdown";

  return (
    <div
      ref={wrapRef}
      className="game-frame relative w-full overflow-hidden rounded-3xl border border-white/10"
      style={{ touchAction: "pan-y" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-[68svh] max-h-[640px] min-h-[420px] w-full"
      />

      {/* HUD */}
      {inPlay && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
            <div className="hud-chip rounded-xl bg-black/45 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Score
              </p>
              <p className="text-lg font-bold leading-tight text-white tabular-nums">
                {hud.score}
              </p>
            </div>

            <div
              key={hud.hearts}
              className="hud-chip rounded-xl bg-black/45 px-3 py-1.5 backdrop-blur-sm"
            >
              <p className="text-lg font-bold leading-tight text-pink-300 tabular-nums">
                ❤ {hud.hearts}
              </p>
            </div>

            <div className="hud-chip rounded-xl bg-black/45 px-3 py-1.5 text-right backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Best
              </p>
              <p className="text-lg font-bold leading-tight text-amber-300 tabular-nums">
                {hud.best}
              </p>
            </div>
          </div>

          {/* Progress toward unlocking the portfolio link */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <div className="mx-auto max-w-xs rounded-xl bg-black/45 px-3 py-2 backdrop-blur-sm">
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest">
                <span className="text-white/55">
                  {hud.clearedGoal ? "Gate unlocked" : "Unlock the gate"}
                </span>
                <span
                  className={
                    hud.clearedGoal ? "text-emerald-300" : "text-white/55"
                  }
                >
                  {hud.clearedGoal ? "✓ done" : `${hud.score} / ${GOAL_SCORE}`}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    hud.clearedGoal
                      ? "bg-emerald-400"
                      : "bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600"
                  }`}
                  style={{ width: `${(hud.goalProgress || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mute lives inside gameplay only, so it can't sit on the
              start screen where people tap Play. */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            className="absolute left-3 top-16 z-10 rounded-full bg-black/45 px-2.5 py-1.5 text-sm backdrop-blur-sm sm:top-20"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </>
      )}

      {/* Unlock toast */}
      {showUnlockToast && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-4">
          <div className="unlock-toast rounded-2xl border border-amber-300/40 bg-[#150a24]/90 px-5 py-3 text-center">
            <p className="text-2xl">🔓</p>
            <p className="mt-1 bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-sm font-black uppercase tracking-widest text-transparent">
              Trial cleared
            </p>
            <p className="mt-0.5 text-xs text-white/70">
              Portfolio unlocked — keep running for a high score
            </p>
          </div>
        </div>
      )}

      {/* Countdown */}
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            key={countdown}
            className="countdown-num bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-8xl font-black text-transparent"
          >
            {countdown === 0 ? "GO!" : countdown}
          </span>
        </div>
      )}

      {/* Start screen */}
      {phase === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-6 text-center backdrop-blur-[2px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-300">
            The lurker trials · level 1
          </p>

          <h3 className="shimmer-text mt-2 bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
            RED FLAG RUN
          </h3>

          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
            Collect the likes ❤️ and dodge the red flags 🚩 — a skill you'll
            need on Instagram anyway.
          </p>

          <p className="mt-3 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
            🔒 Score {GOAL_SCORE} to unlock my portfolio
          </p>

          <button
            type="button"
            onClick={startGame}
            className="press-dark play-glow mt-6 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-10 py-3.5 text-lg font-bold text-white"
          >
            ▶ Play
          </button>

          <p className="mt-4 text-xs text-white/45">
            {isTouchDevice
              ? "swipe ← → to dodge · swipe ↑ or tap to jump"
              : "← → to dodge · space to jump"}
          </p>

          {hud.best > 0 && (
            <p className="mt-2 text-xs font-semibold text-amber-300">
              Your best: {hud.best}
            </p>
          )}
        </div>
      )}

      {/* Game over */}
      {phase === "over" && overStats && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-6 text-center backdrop-blur-[2px]">
          <div className="over-panel w-full max-w-xs rounded-3xl border border-white/10 bg-[#150a24]/90 p-6">
            <p className="text-4xl">{overStats.everUnlocked ? "🏆" : "💔"}</p>

            <h3 className="mt-1 text-2xl font-black text-white">
              {overStats.everUnlocked ? "GATE'S OPEN" : "CAUGHT A RED FLAG"}
            </h3>

            {overStats.isRecord && (
              <p className="mt-2 inline-block rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-3 py-0.5 text-xs font-bold text-white">
                ✦ NEW BEST ✦
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Score", value: overStats.score },
                { label: "Likes", value: `❤ ${overStats.hearts}` },
                { label: "Best", value: overStats.best },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/5 px-2 py-2.5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-base font-bold text-white tabular-nums">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {verdictFor(overStats.score)}
            </p>

            {overStats.everUnlocked ? (
              <>
                <a
                  href={PORTFOLIO_URL}
                  onClick={() =>
                    trackEvent("Instagram Game", "Click", "Won To Portfolio")
                  }
                  className="press-dark play-glow mt-5 block w-full rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-6 py-3 font-bold text-white"
                >
                  See what I actually build →
                </a>

                {redirectIn !== null && (
                  <p className="mt-2.5 text-xs text-white/50">
                    Taking you there in{" "}
                    <span className="font-bold text-amber-300 tabular-nums">
                      {redirectIn}
                    </span>
                    s ·{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setRedirectIn(null);
                        trackEvent(
                          "Instagram Game",
                          "Click",
                          "Cancel Redirect"
                        );
                      }}
                      className="font-semibold text-white/75 underline underline-offset-2"
                    >
                      stay here
                    </button>
                  </p>
                )}

                <button
                  type="button"
                  onClick={startGame}
                  className="press-dark mt-2.5 w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/80"
                >
                  🔁 One more run
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                  🔒 {Math.max(GOAL_SCORE - overStats.score, 1)} more points to
                  unlock my portfolio
                </p>

                <button
                  type="button"
                  onClick={startGame}
                  className="press-dark play-glow mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 px-6 py-3 font-bold text-white"
                >
                  🔁 Run it back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
