import { useEffect, useRef, useState } from "react";

// Bundled locally by Vite — faster and more reliable than hotlinking
// the images from raw.githubusercontent.com.
import profileImg from "../profile.jpeg";
import internImg from "../intern.jpg";
import posterImg from "../poster.jpg";

const GITHUB_USERNAME = "Amuo007";
const EXCLUDED_REPOS = [];

// Using RegExp constructors prevents the Markdown link patterns
// from being mangled when copied between editors.
const MARKDOWN_LINK_TEXT_REGEX = new RegExp(
  "\\[([^\\]]+)\\]\\([^)]+\\)",
  "g"
);

const MARKDOWN_LINK_REGEX = new RegExp(
  "\\[([^\\]]+)\\]\\(([^)]+)\\)",
  "g"
);

const LANGUAGE_COLORS = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Swift: "#F05138",
  Java: "#b07219",
  "C++": "#f34b7d",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  "C#": "#6b46c1",
};

const getLanguageColor = (lang) => LANGUAGE_COLORS[lang] || "#8b949e";

const trackEvent = (category, action, name, value) => {
  if (typeof window !== "undefined" && window._paq) {
    const event = ["trackEvent", category, action, name];

    if (Number.isFinite(value)) {
      event.push(value);
    }

    window._paq.push(event);
  }
};

const trackLink = (url, label) => {
  trackEvent("Link", "Outbound Click", label);

  if (
    typeof window !== "undefined" &&
    window._paq &&
    typeof url === "string" &&
    url.startsWith("http")
  ) {
    window._paq.push(["trackLink", url, "link"]);
  }
};

// The GitHub API allows only 60 unauthenticated requests per hour per IP,
// so responses are cached in localStorage and reused as a fallback whenever
// the API rate-limits us. Caching is best-effort (private mode, quota).
const REPO_CACHE_KEY = "gh-repos-v1";
const README_CACHE_KEY = "gh-readme-summaries-v1";
const REPO_CACHE_TTL = 30 * 60 * 1000;
const README_CACHE_TTL = 24 * 60 * 60 * 1000;

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full — skip caching.
  }
};

// Keep only the fields the UI renders so the cache stays small.
const slimRepo = (repo) => ({
  id: repo.id,
  name: repo.name,
  html_url: repo.html_url,
  description: repo.description,
  language: repo.language,
  updated_at: repo.updated_at,
  stargazers_count: repo.stargazers_count,
  forks_count: repo.forks_count,
  topics: repo.topics,
});

const extractSummary = (md) => {
  if (!md) return null;

  const lines = md.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("!") ||
      trimmed.startsWith("<") ||
      trimmed.startsWith("```") ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("---") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("-")
    ) {
      continue;
    }

    const clean = trimmed
      .replace(MARKDOWN_LINK_TEXT_REGEX, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

    if (clean.length > 20) {
      return clean.length > 180 ? `${clean.slice(0, 180)}…` : clean;
    }
  }

  return null;
};

const renderMarkdown = (md) => {
  if (!md) {
    return "<p class='text-gray-500 italic'>No README found for this repository.</p>";
  }

  const html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-base font-bold text-gray-800 mt-4 mb-1">$1</h3>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2">$1</h2>'
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 class="text-xl font-bold text-gray-900 mt-5 mb-2">$1</h1>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 text-slate-800 px-1 rounded text-sm font-mono">$1</code>'
    )
    .replace(
      MARKDOWN_LINK_REGEX,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950">$1</a>'
    )
    .replace(
      /^\s*[-*] (.+)$/gm,
      '<li class="ml-4 list-disc text-gray-700 text-sm">$1</li>'
    )
    .replace(/\n\n/g, '</p><p class="text-gray-700 text-sm mb-2">')
    .replace(/\n/g, "<br/>");

  return `<p class="text-gray-700 text-sm mb-2">${html}</p>`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

const experiences = [
  {
    role: "Software Engineer Intern",
    company: "Geometris LP",
    type: "Full-time",
    dates: "May 2026 – Present",
    location: "Houston, TX · On-site",
    image: internImg,
    logo: "G",
    logoColor: "bg-blue-600",
    description: [
      "Working in a professional software engineering environment on real development tasks and internal engineering workflows.",
      "Contributing to debugging, feature improvements, and application-related tasks.",
      "Gaining hands-on experience collaborating with engineers and working with production-oriented systems.",
    ],
    skills: ["Software Engineering", "JavaScript", "React", "Debugging"],
  },
  {
    role: "Undergraduate Student Researcher",
    company: "University of Houston",
    type: "Full-time",
    dates: "Jan 2026 – Aug 2026",
    location: "United States · On-site",
    image: posterImg,
    logo: "UH",
    logoColor: "bg-red-600",
    description: [
      "Worked on Internet-in-a-Box and explored ways to improve search using embeddings and retrieval-augmented generation.",
      "Evaluated how offline search and AI-assisted retrieval perform on low-end Android devices.",
      "Explored practical educational search systems for environments with limited internet access.",
    ],
    skills: ["RAG", "Embeddings", "JavaScript", "Android", "IIAB"],
  },
  {
    role: "Software Engineer",
    company: "Stealth",
    type: "Internship",
    dates: "Jan 2026 – May 2026",
    location: "Remote",
    image: null,
    logo: "S",
    logoColor: "bg-gray-900",
    description: [
      "Contributed to an AR development team building applications for Meta Quest 3.",
      "Supported Unity-based development workflows for immersive application features.",
      "Collaborated in a remote engineering environment to help deliver AR-related functionality.",
    ],
    skills: ["Unity", "C#", "JavaScript", "AR Development", "Meta Quest 3"],
  },
];

const skills = {
  Languages: ["JavaScript", "Python", "Java", "Swift", "C++", "C#"],
  Frontend: ["React", "HTML", "CSS", "Tailwind CSS"],
  Backend: ["Node.js", "Express.js", "REST APIs"],
  "Mobile / AR": ["iOS", "SwiftUI", "Android", "Unity", "Meta Quest 3", "ARKit"],
  "AI / Research": ["RAG", "Embeddings", "Machine Learning", "TensorFlow"],
  Tools: ["Git", "GitHub", "Docker", "Firebase", "MongoDB", "PostgreSQL"],
};

const heroHighlights = [
  {
    label: "Current",
    value: "Geometris LP",
    detail: "Software Engineer Intern",
  },
  {
    label: "Research",
    value: "RAG search",
    detail: "Internet-in-a-Box on low-end Android",
  },
  {
    label: "Google PM",
    value: "4 / 7 modules",
    detail: "Professional Certificate in progress",
  },
];

const certifications = [
  {
    title: "Google Project Management: Professional Certificate",
    issuer: "Google · Coursera",
    inProgress: true,
    logo: "google",
    progress: {
      completed: 4,
      total: 7,
      label: "4 of 7 modules complete",
      note: "Module 4 is complete; modules 5, 6, and 7 are left.",
    },
  },
  {
    title: "Complete Data Science & Machine Learning Bootcamp",
    issuer: "Udemy",
    issued: "Jan 2022",
    logo: "udemy",
  },
  {
    title: "TensorFlow 2: Deep Learning & Artificial Intelligence",
    issuer: "Udemy",
    issued: "May 2024",
    logo: "udemy",
  },
  {
    title: "iOS & Swift - The Complete iOS App Development Bootcamp",
    issuer: "Udemy",
    issued: "Dec 2023",
    logo: "udemy",
  },
  {
    title: "The Complete Full-Stack Web Development Bootcamp",
    issuer: "Udemy",
    issued: "May 2022",
    logo: "udemy",
  },
  {
    title: "Electronic Arts - Software Engineering Job Simulation",
    issuer: "Forage",
    issued: "Feb 2025",
    credentialId: "69W4vPnb6zwW6gq75",
    logo: "forage",
  },
];

const softwareEngineeringSequence = [
  {
    code: "COSC 4351",
    title: "Fundamentals of Software Engineering",
    stage: "Engineering foundation",
    summary:
      "Software lifecycle, requirements, planning, quality assurance, and maintenance.",
  },
  {
    code: "COSC 4353",
    title: "Software Design",
    stage: "Capstone I",
    summary:
      "Object-oriented design, architecture, modeling, patterns, testing, and refactoring.",
  },
  {
    code: "COSC 4354",
    title: "Software Development Practices",
    stage: "Capstone II",
    summary:
      "Agile team delivery, estimation, risk management, automated testing, and deployment.",
  },
];

const CONTRIB_COLORS = [
  "bg-slate-100",
  "bg-blue-300",
  "bg-blue-500",
  "bg-blue-700",
  "bg-blue-900",
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ContributionGraph = () => {
  const [contribData, setContribData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [play, setPlay] = useState(false);
  const scrollerRef = useRef(null);

  // Start with the most recent months in view on narrow screens,
  // then pop the cells in once the graph is actually on screen.
  useEffect(() => {
    if (!contribData) return undefined;

    const scroller = scrollerRef.current;

    if (scroller) {
      scroller.scrollLeft = scroller.scrollWidth;
    }

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      reduceMotion ||
      typeof IntersectionObserver === "undefined" ||
      !scroller
    ) {
      setPlay(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPlay(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(scroller);

    return () => observer.disconnect();
  }, [contribData]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`
        );

        if (!res.ok) {
          throw new Error(`Contributions API error: ${res.status}`);
        }

        const json = await res.json();

        if (!cancelled) {
          setContribData(json);
        }
      } catch (err) {
        console.error("Failed to fetch contributions:", err);

        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (!contribData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  const days = contribData.contributions;
  const totalLastYear = contribData.total?.lastYear ?? 0;

  const weeks = [];
  const firstDow = new Date(`${days[0].date}T00:00:00`).getDay();
  let week = new Array(firstDow).fill(null);

  for (const day of days) {
    week.push(day);

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    weeks.push(week);
  }

  const monthOfWeek = weeks.map((w) => {
    const firstDay = w.find(Boolean);
    return firstDay
      ? new Date(`${firstDay.date}T00:00:00`).getMonth()
      : null;
  });

  return (
    <div
      className={`fade-in ${
        play ? "contrib-play" : "contrib-wait"
      } bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h3 className="text-lg font-bold text-gray-900">GitHub Activity</h3>

        <p className="text-sm text-gray-500">
          <span className="font-semibold text-blue-600">
            <CountUp value={totalLastYear} />
          </span>{" "}
          contributions in the last year
        </p>
      </div>

      <div ref={scrollerRef} className="overflow-x-auto no-scrollbar">
        <div className="inline-block">
          <div className="flex gap-[3px] ml-8 mb-1">
            {monthOfWeek.map((month, i) => (
              <div
                key={i}
                className="w-2.5 text-[10px] text-gray-500 overflow-visible whitespace-nowrap"
              >
                {month !== null && month !== monthOfWeek[i - 1]
                  ? MONTH_LABELS[month]
                  : ""}
              </div>
            ))}
          </div>

          <div className="flex">
            <div className="flex flex-col gap-[3px] w-8 text-[10px] text-gray-500 pr-1">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                <div key={i} className="h-2.5 leading-[10px]">
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((w, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, di) => {
                    const day = w[di];

                    if (!day) {
                      return <div key={di} className="w-2.5 h-2.5" />;
                    }

                    return (
                      <div
                        key={di}
                        title={`${day.count} contribution${
                          day.count === 1 ? "" : "s"
                        } on ${day.date}`}
                        style={{
                          "--cell-delay": `${wi * 14 + di * 26}ms`,
                        }}
                        className={`contrib-cell w-2.5 h-2.5 rounded-[2px] ${
                          CONTRIB_COLORS[day.level] || CONTRIB_COLORS[0]
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-500">
            <span className="mr-1">Less</span>
            {CONTRIB_COLORS.map((color) => (
              <div key={color} className={`w-2.5 h-2.5 rounded-[2px] ${color}`} />
            ))}
            <span className="ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EMAIL_ADDRESS = "Amrinderbalharjob@gmail.com";

// Fades content in as it scrolls into view. Falls back to visible
// when IntersectionObserver isn't available.
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    if (typeof IntersectionObserver === "undefined") {
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
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

// Counts up from 0 once the number scrolls into view.
const CountUp = ({ value, duration = 1200 }) => {
  const ref = useRef(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (started.current) return;

        started.current = true;
        observer.disconnect();

        const startTime = performance.now();

        const tick = (now) => {
          const t = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);

          setDisplay(Math.round(eased * value));

          if (t < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
};

// GitHub-style bar showing how repositories split across languages.
const LanguageBar = ({ repos }) => {
  const counts = {};

  repos.forEach((repo) => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
    }
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) return null;

  return (
    <Reveal className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Languages</h3>

        <p className="text-sm text-gray-500">
          across {total} repositor{total === 1 ? "y" : "ies"}
        </p>
      </div>

      <div className="lang-track flex h-2.5 rounded-full overflow-hidden bg-gray-100 gap-[2px]">
        {entries.map(([language, count]) => (
          <div
            key={language}
            title={`${language}: ${count}`}
            className="h-full"
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: getLanguageColor(language),
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {entries.map(([language, count], index) => (
          <span
            key={language}
            style={{ "--stagger-delay": `${Math.min(index * 60, 360)}ms` }}
            className="stagger-item flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getLanguageColor(language) }}
            />
            {language}
            <span className="text-gray-400">{count}</span>
          </span>
        ))}
      </div>
    </Reveal>
  );
};

// Official multicolor Google "G" mark.
const GoogleLogo = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const UdemyLogo = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="#A435F0"
    aria-hidden="true"
  >
    <path d="M12 0 5.81 3.573v3.574l6.189-3.574 6.191 3.574V3.573L12 0ZM5.81 10.148v8.144c0 1.85.589 3.243 1.741 4.234C8.703 23.517 10.177 24 11.973 24s3.269-.482 4.448-1.474c1.179-.991 1.768-2.439 1.768-4.314v-8.064h-3.242v7.85c0 2.036-1.509 3.055-2.948 3.055-1.428 0-2.947-.991-2.947-3.027v-7.878H5.81Z" />
  </svg>
);

const ForageLogo = () => (
  <img
    src="https://cdn-assets.theforage.com/favicon/favicon-96x96.png"
    alt=""
    className="w-4 h-4 object-contain"
    loading="lazy"
  />
);

const CertificationLogo = ({ provider }) => (
  <span
    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm"
    aria-hidden="true"
  >
    {provider === "google" && <GoogleLogo />}
    {provider === "udemy" && <UdemyLogo />}
    {provider === "forage" && <ForageLogo />}
  </span>
);

// Copies the email address and briefly confirms it.
const CopyEmailButton = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    trackEvent("Contact", "Click", "Copy Email");

    try {
      await navigator.clipboard.writeText(EMAIL_ADDRESS);
    } catch {
      const helper = document.createElement("textarea");

      helper.value = EMAIL_ADDRESS;
      helper.setAttribute("readonly", "");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();

      try {
        document.execCommand("copy");
      } catch {
        // Copy unsupported — the mailto link still works.
      }

      document.body.removeChild(helper);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copyEmail}
      className={`press text-xs border rounded-full px-2.5 py-0.5 align-middle ${
        copied
          ? "text-green-700 border-green-300 bg-green-50"
          : "text-gray-600 border-gray-300 bg-white hover:text-gray-950 hover:border-gray-400"
      }`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
};

// Floating button that appears after scrolling down a bit.
const BackToTop = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        trackEvent("Navigation", "Click", "Back to Top");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`back-to-top ${shown ? "is-shown" : ""}`}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  );
};

const NavLink = ({ href, label, active }) => (
  <a
    href={href}
    onClick={() => trackEvent("Navigation", "Click", label)}
    aria-current={active ? "true" : undefined}
    className={`nav-link ${
      active ? "nav-link-active text-gray-950" : "text-gray-600"
    } flex-none text-sm font-medium hover:text-gray-950 transition-colors px-2.5 py-2 md:px-3 whitespace-nowrap`}
  >
    {label}
  </a>
);

const SkillTag = ({ skill, index = 0 }) => (
  <span
    style={{ "--stagger-delay": `${Math.min(index * 40, 400)}ms` }}
    className="stagger-item bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium"
  >
    {skill}
  </span>
);

const SectionHeading = ({ title, subtitle }) => (
  <Reveal className="mb-8">
    <h2 className="heading-accent text-3xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
  </Reveal>
);

const ProjectOverview = ({ repos, languages }) => {
  if (repos.length === 0) return null;

  const latestRepo = repos[0];

  const stats = [
    {
      label: "Repositories",
      value: repos.length,
      detail: "All public non-fork repos",
    },
    {
      label: "Languages",
      value: languages.length,
      detail: "Public language mix",
    },
    {
      label: "Newest Update",
      value: latestRepo ? formatDate(latestRepo.updated_at) : "Live",
      detail: latestRepo ? latestRepo.name : "Synced from GitHub",
    },
  ];

  return (
    <Reveal className="grid sm:grid-cols-3 gap-3 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          style={{ "--stagger-delay": `${index * 70}ms` }}
          className="stagger-item bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {stat.label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {stat.value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
        </div>
      ))}
    </Reveal>
  );
};

const RepoCard = ({ repo, isExpanded, isLoading, details, onToggleReadme }) => {
  const readme = details?.readme;
  const description = repo.description || details?.summary;
  const summaryLoading = !repo.description && details === undefined;

  const handleRepositoryClick = () => {
    trackEvent("Projects", "Open Repository", repo.name);
  };

  const handleReadmeClick = () => {
    trackEvent(
      "Projects",
      isExpanded ? "Hide README" : "View README",
      repo.name
    );

    onToggleReadme(repo.name);
  };

  return (
    <div className="card-lift h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              onClick={handleRepositoryClick}
              className="text-xl font-bold text-gray-900 hover:text-gray-600"
            >
              {repo.name}
            </a>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {repo.language && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: getLanguageColor(repo.language),
                    }}
                  />
                  {repo.language}
                </span>
              )}

              <span>Updated {formatDate(repo.updated_at)}</span>

              {repo.stargazers_count > 0 && (
                <span>★ {repo.stargazers_count}</span>
              )}

              {repo.forks_count > 0 && (
                <span>Forks {repo.forks_count}</span>
              )}
            </div>
          </div>

          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            onClick={handleRepositoryClick}
            className="press text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            GitHub
          </a>
        </div>

        <div className="mb-4">
          {summaryLoading ? (
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          ) : description ? (
            <p className="text-gray-700 text-sm leading-relaxed">
              {description}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic">
              No description available
            </p>
          )}
        </div>

        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {repo.topics.slice(0, 8).map((topic) => (
              <span
                key={topic}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleReadmeClick}
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
        >
          {isLoading
            ? "Loading README..."
            : isExpanded
              ? "Hide README"
              : "View README"}
        </button>
      </div>

      {isExpanded && (
        <div className="panel-in border-t border-gray-200 bg-gray-50 px-6 py-5">
          <div
            className="prose prose-sm max-w-none text-gray-700 max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [repos, setRepos] = useState([]);
  const [repoDetails, setRepoDetails] = useState({});
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState(null);
  const [loadingReadme, setLoadingReadme] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All");
  const progressRef = useRef(null);
  const viewedSectionsRef = useRef(new Set());
  const scrollDepthsRef = useRef(new Set());
  const sessionStartedAtRef = useRef(Date.now());

  useEffect(() => {
    fetchRepos();
    // Fetch once on mount; manual refreshes go through the Refresh button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackEvent("Engagement", "Page Ready", "Portfolio");

    const depthMarks = [25, 50, 75, 90];
    const trackedDepths = scrollDepthsRef.current;
    let sessionTimeTracked = false;

    const trackScrollDepth = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;

      if (max <= 0) return;

      const percent = Math.round((window.scrollY / max) * 100);

      depthMarks.forEach((mark) => {
        if (percent >= mark && !trackedDepths.has(mark)) {
          trackedDepths.add(mark);
          trackEvent("Engagement", "Scroll Depth", `${mark}%`, mark);
        }
      });
    };

    const trackSessionTime = () => {
      if (sessionTimeTracked) return;

      const seconds = Math.round(
        (Date.now() - sessionStartedAtRef.current) / 1000
      );

      if (seconds < 2) return;

      sessionTimeTracked = true;
      trackEvent("Engagement", "Session Seconds", "Portfolio", seconds);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackSessionTime();
      }
    };

    const handleLinkClick = (event) => {
      const link = event.target.closest?.("a[href]");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href || href.startsWith("#")) return;

      const url = new URL(link.href);
      const isContactLink = url.protocol === "mailto:" || url.protocol === "tel:";
      const isOutbound = isContactLink || url.origin !== window.location.origin;

      if (!isOutbound) return;

      const label =
        link.getAttribute("aria-label") ||
        link.textContent.trim() ||
        url.hostname ||
        href;

      trackLink(link.href, label);
    };

    trackScrollDepth();
    window.addEventListener("scroll", trackScrollDepth, { passive: true });
    window.addEventListener("resize", trackScrollDepth);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("scroll", trackScrollDepth);
      window.removeEventListener("resize", trackScrollDepth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleLinkClick);
      trackSessionTime();
    };
  }, []);

  // Header shadow + scroll progress line, updated outside React for smoothness.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }

      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Highlight the nav link of the section crossing the middle of the screen.
  useEffect(() => {
    const ids = ["experience", "projects", "skills", "education", "contact"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (typeof IntersectionObserver === "undefined" || sections.length === 0) {
      return undefined;
    }

    const inView = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            inView.add(entry.target.id);

            if (!viewedSectionsRef.current.has(entry.target.id)) {
              viewedSectionsRef.current.add(entry.target.id);
              trackEvent("Engagement", "Section View", entry.target.id);
            }
          } else {
            inView.delete(entry.target.id);
          }
        });

        setActiveSection(ids.find((id) => inView.has(id)) || "");
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const applyRepos = (list) => {
    setRepos(list);

    list.forEach((repo) => {
      if (!repo.description) {
        fetchReadmeSummary(repo.name);
      }
    });
  };

  const fetchRepos = async (force = false) => {
    setLoadingRepos(true);
    setRepoError(false);

    const cached = readCache(REPO_CACHE_KEY);

    if (!force && cached && Date.now() - cached.ts < REPO_CACHE_TTL) {
      trackEvent(
        "Projects",
        "Repositories Cache Hit",
        "GitHub",
        cached.repos.length
      );
      applyRepos(cached.repos);
      setLoadingRepos(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
      );

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }

      const data = await res.json();

      const filtered = data
        .filter((repo) => !repo.fork && !EXCLUDED_REPOS.includes(repo.name))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .map(slimRepo);

      writeCache(REPO_CACHE_KEY, { ts: Date.now(), repos: filtered });
      trackEvent(
        "Projects",
        force ? "Repositories Refreshed" : "Repositories Loaded",
        "GitHub",
        filtered.length
      );
      applyRepos(filtered);
    } catch (err) {
      console.error("Failed to fetch repos:", err);

      if (cached && cached.repos && cached.repos.length > 0) {
        // Rate-limited or offline — show the last good data instead of an error.
        trackEvent(
          "Projects",
          "Repositories Cache Fallback",
          "GitHub",
          cached.repos.length
        );
        applyRepos(cached.repos);
      } else {
        trackEvent("Projects", "Repositories Error", "GitHub");
        setRepoError(true);
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchReadmeSummary = async (repoName) => {
    const cache = readCache(README_CACHE_KEY);

    if (
      cache &&
      cache.items &&
      cache.items[repoName] !== undefined &&
      Date.now() - cache.ts < README_CACHE_TTL
    ) {
      const summary = cache.items[repoName];

      setRepoDetails((prev) => ({
        ...prev,
        [repoName]: {
          ...prev[repoName],
          summary,
        },
      }));

      return;
    }

    const saveSummary = (summary) => {
      const current = readCache(README_CACHE_KEY) || {
        ts: Date.now(),
        items: {},
      };

      current.items[repoName] = summary;
      writeCache(README_CACHE_KEY, current);
    };

    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
        {
          headers: {
            Accept: "application/vnd.github.raw",
          },
        }
      );

      if (res.ok) {
        const text = await res.text();
        const summary = extractSummary(text);

        saveSummary(summary);

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: text,
            summary,
          },
        }));
      } else if (res.status === 404) {
        saveSummary(null);

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: null,
            summary: null,
          },
        }));
      }
    } catch {
      setRepoDetails((prev) => ({
        ...prev,
        [repoName]: {
          ...prev[repoName],
          readme: null,
          summary: null,
        },
      }));
    }
  };

  const fetchFullReadme = async (repoName) => {
    if (repoDetails[repoName]?.readme !== undefined) {
      setExpandedRepo(expandedRepo === repoName ? null : repoName);
      return;
    }

    setLoadingReadme(repoName);

    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
        {
          headers: {
            Accept: "application/vnd.github.raw",
          },
        }
      );

      if (res.ok) {
        const text = await res.text();
        const summary = extractSummary(text);

        trackEvent("Projects", "README Loaded", repoName);

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: text,
            summary,
          },
        }));
      } else {
        trackEvent("Projects", "README Missing", repoName);

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: null,
            summary: null,
          },
        }));
      }
    } catch {
      setRepoDetails((prev) => ({
        ...prev,
        [repoName]: {
          ...prev[repoName],
          readme: null,
          summary: null,
        },
      }));
    } finally {
      setLoadingReadme(null);
      setExpandedRepo(repoName);
    }
  };

  const toggleReadme = (repoName) => {
    if (expandedRepo === repoName) {
      setExpandedRepo(null);
    } else {
      fetchFullReadme(repoName);
    }
  };

  const languageCounts = {};

  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);

  const filteredRepos =
    languageFilter === "All"
      ? repos
      : repos.filter((repo) => repo.language === languageFilter);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f7f8] text-gray-900">
      <header
        className={`bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30 transition-shadow duration-200 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="max-w-6xl min-w-0 mx-auto px-4 md:px-6 py-2.5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
          <a
            href="#home"
            onClick={() => trackEvent("Navigation", "Click", "Home")}
            className="font-bold text-xl text-gray-900 px-2.5 md:px-0 py-1 md:py-0"
          >
            Amrinder Singh
          </a>

          <nav className="flex w-full min-w-0 max-w-full flex-wrap gap-x-2 gap-y-1 px-0 md:w-auto md:flex-nowrap md:gap-2">
            <NavLink
              href="#experience"
              label="Experience"
              active={activeSection === "experience"}
            />
            <NavLink
              href="#projects"
              label="Projects"
              active={activeSection === "projects"}
            />
            <NavLink
              href="#skills"
              label="Skills"
              active={activeSection === "skills"}
            />
            <NavLink
              href="#education"
              label="Education"
              active={activeSection === "education"}
            />
            <NavLink
              href="#contact"
              label="Contact"
              active={activeSection === "contact"}
            />
          </nav>
        </div>

        <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      </header>

      <main>
        <section id="home" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="w-full max-w-full overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-10">
            <div className="flex min-w-0 flex-col md:flex-row md:items-center gap-8">
              <img
                src={profileImg}
                alt="Portrait of Amrinder Singh"
                className="hero-rise mx-auto w-32 h-32 md:mx-0 md:w-36 md:h-36 rounded-full object-cover border-2 border-red-700 shadow-sm"
              />

              <div className="min-w-0 flex-1">
                <p
                  className="hero-rise break-words text-sm font-semibold leading-snug text-red-700 sm:text-base mb-2"
                  style={{ "--rise-delay": "40ms" }}
                >
                  <span>Software Engineer Intern</span>
                  <span className="hidden sm:inline"> · </span>
                  <span className="block sm:inline">
                    Computer Science Student
                  </span>
                </p>

                <h1
                  className="hero-rise text-4xl md:text-5xl font-bold text-gray-900 mb-3"
                  style={{ "--rise-delay": "80ms" }}
                >
                  Amrinder Singh
                </h1>

                <p
                  className="hero-rise text-xl text-gray-600 mb-4"
                  style={{ "--rise-delay": "120ms" }}
                >
                  Full-Stack, AI, and AR Developer
                </p>

                <p
                  className="hero-rise max-w-3xl break-words text-gray-700 leading-relaxed mb-6"
                  style={{ "--rise-delay": "160ms" }}
                >
                  Computer Science student at the University of Houston building
                  full-stack, AI, and AR applications. Currently working as a
                  Software Engineer Intern at Geometris LP. Previously researched
                  offline search using embeddings and RAG for Internet-in-a-Box.
                </p>

                <div
                  className="hero-rise flex max-w-full flex-wrap items-center gap-3"
                  style={{ "--rise-delay": "200ms" }}
                >
                  <a
                    href="#projects"
                    onClick={() =>
                      trackEvent("Hero", "Click", "View Projects")
                    }
                    className="press w-full bg-gray-950 text-center text-white px-4 sm:w-auto sm:px-5 py-2.5 rounded-lg hover:bg-gray-800 font-medium"
                  >
                    View Projects
                  </a>

                  <a
                    href="#experience"
                    onClick={() =>
                      trackEvent("Hero", "Click", "View Experience")
                    }
                    className="press w-full bg-white text-center text-gray-900 border border-gray-300 px-4 sm:w-auto sm:px-5 py-2.5 rounded-lg hover:bg-gray-50"
                  >
                    View Experience
                  </a>

                  <a
                    href="https://github.com/Amuo007"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub profile"
                    title="GitHub"
                    onClick={() =>
                      trackEvent("Contact", "Click", "GitHub Profile")
                    }
                    className="press bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/amrinder-singh-uh-computer-science/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn profile"
                    title="LinkedIn"
                    onClick={() =>
                      trackEvent("Contact", "Click", "LinkedIn Profile")
                    }
                    className="press bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                    </svg>
                  </a>

                  <a
                    href="mailto:Amrinderbalharjob@gmail.com"
                    aria-label="Send email"
                    title="Email"
                    onClick={() =>
                      trackEvent("Contact", "Click", "Hero Email")
                    }
                    className="press bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </a>
                </div>

                <div
                  className="hero-rise mt-8 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3"
                  style={{ "--rise-delay": "240ms" }}
                >
                  {heroHighlights.map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-1 font-semibold text-slate-950">
                        {item.value}
                      </p>

                      <p className="mt-1 text-sm leading-snug text-slate-500">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeading
            title="Experience"
            subtitle="Professional, research, and internship experience."
          />

          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <Reveal
                key={`${exp.company}-${exp.role}`}
                delay={Math.min(index * 80, 240)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-shrink-0">
                    {exp.image ? (
                      <img
                        src={exp.image}
                        alt={exp.company}
                        loading="lazy"
                        className="w-full md:w-40 h-48 md:h-28 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full md:w-40 h-28 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                        <div
                          className={`w-14 h-14 ${exp.logoColor} rounded-full flex items-center justify-center text-xl font-bold`}
                        >
                          {exp.logo}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {exp.role}
                        </h3>

                        <p className="text-gray-900 font-semibold">
                          {exp.company} · {exp.type}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          {exp.location}
                        </p>
                      </div>

                      <span className="text-sm bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-full w-fit">
                        {exp.dates}
                      </span>
                    </div>

                    <ul className="space-y-2 text-gray-700 text-sm mb-4">
                      {exp.description.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-slate-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((skill, skillIndex) => (
                        <SkillTag key={skill} skill={skill} index={skillIndex} />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="projects" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeading
            title="Projects"
            subtitle="All public non-fork repositories, sorted by newest update."
          />

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              GitHub:{" "}
              <a
                href={`https://github.com/${GITHUB_USERNAME}`}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent("Projects", "Click", "GitHub Username")
                }
                className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
              >
                @{GITHUB_USERNAME}
              </a>
            </p>

            <button
              type="button"
              onClick={() => {
                trackEvent("Projects", "Click", "Refresh Repositories");
                fetchRepos(true);
              }}
              className="press text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {!loadingRepos && !repoError && repos.length > 0 && (
            <ProjectOverview repos={repos} languages={languages} />
          )}

          <ContributionGraph />

          {!loadingRepos && !repoError && repos.length > 0 && (
            <LanguageBar repos={repos} />
          )}

          {!loadingRepos && !repoError && languages.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  trackEvent("Projects", "Filter", "All");
                  setLanguageFilter("All");
                }}
                className={`press text-xs font-medium px-3 py-1.5 rounded-full border ${
                  languageFilter === "All"
                    ? "bg-gray-950 text-white border-gray-950"
                    : "bg-white text-gray-700 border-gray-300 hover:text-gray-950 hover:border-gray-400"
                }`}
              >
                All ({repos.length})
              </button>

              {languages.map(([language, count]) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => {
                    trackEvent("Projects", "Filter", language);
                    setLanguageFilter(language);
                  }}
                  className={`press text-xs font-medium px-3 py-1.5 rounded-full border ${
                    languageFilter === language
                      ? "bg-gray-950 text-white border-gray-950"
                      : "bg-white text-gray-700 border-gray-300 hover:text-gray-950 hover:border-gray-400"
                  }`}
                >
                  {language} ({count})
                </button>
              ))}
            </div>
          )}

          {loadingRepos ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : repoError ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
              <p className="text-gray-600 mb-4">
                Couldn't load repositories from GitHub right now.
              </p>
              <button
                type="button"
                onClick={() => {
                  trackEvent("Projects", "Click", "Retry Repositories");
                  fetchRepos(true);
                }}
                className="press text-sm bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">
              No repositories found.
            </div>
          ) : (
            filteredRepos.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">
                No repositories match this filter.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {filteredRepos.map((repo, index) => (
                  <Reveal
                    key={repo.id}
                    delay={(index % 2) * 70}
                    className="h-full"
                  >
                    <RepoCard
                      repo={repo}
                      isExpanded={expandedRepo === repo.name}
                      isLoading={loadingReadme === repo.name}
                      details={repoDetails[repo.name]}
                      onToggleReadme={toggleReadme}
                    />
                  </Reveal>
                ))}
              </div>
            )
          )}
        </section>

        <section id="skills" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeading
            title="Skills"
            subtitle="Technologies I use across software, web, mobile, AI, and AR development."
          />

          <Reveal className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(skills).map(([category, skillList]) => (
                <div key={category}>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">
                    {category}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {skillList.map((skill, skillIndex) => (
                      <SkillTag key={skill} skill={skill} index={skillIndex} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="education" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeading
            title="Education & Certifications"
            subtitle="Academic background and software-related training."
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <Reveal className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden">
                  <img
                    src="https://www.uh.edu/brand/_img/uh-interlock-logo.png"
                    alt="University of Houston interlocking UH logo"
                    className="h-14 w-14 scale-[1.9] object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900">
                    University of Houston
                  </h3>

                  <p className="mt-1 text-gray-700">
                    Bachelor of Science in Computer Science
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Expected Graduation: December 2026
                  </p>
                </div>
              </div>

              <p className="text-gray-700 text-sm mt-4 leading-relaxed">
                Additional coursework includes Data Structures & Algorithms,
                Operating Systems, Database Systems, and Computer Networking.
              </p>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <h4 className="font-bold text-gray-900">
                    Capstone in Software Design
                  </h4>

                  <span className="text-sm font-medium text-emerald-700">
                    Completed
                  </span>
                </div>

                <div className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
                  {softwareEngineeringSequence.map((course) => (
                    <div key={course.code} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="text-xs font-semibold text-red-700">
                          {course.code}
                        </span>

                        <span className="text-xs text-gray-500">
                          {course.stage}
                        </span>
                      </div>

                      <p className="mt-1 font-semibold text-gray-900">
                        {course.title}
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        {course.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal
              delay={100}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Certifications
              </h3>

              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div
                    key={cert.title}
                    style={{ "--stagger-delay": `${Math.min(index * 70, 420)}ms` }}
                    className={`stagger-item border-l-4 pl-4 ${
                      cert.inProgress ? "border-blue-500" : "border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {cert.logo && <CertificationLogo provider={cert.logo} />}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-gray-900">
                          {cert.title}
                        </p>

                        <p className="mt-0.5 text-sm text-gray-600">
                          {cert.issuer}
                          {cert.issued ? ` · Issued ${cert.issued}` : ""}
                        </p>

                        {cert.inProgress && (
                          <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            In Progress
                          </span>
                        )}

                        {cert.progress && (
                          <div className="mt-3 max-w-md">
                            <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600 mb-1.5">
                              <span>{cert.progress.label}</span>
                              <span>
                                {Math.round(
                                  (cert.progress.completed /
                                    cert.progress.total) *
                                    100
                                )}
                                %
                              </span>
                            </div>

                            <div
                              className="h-2 rounded-full bg-slate-100 overflow-hidden"
                              aria-label={`${cert.progress.completed} of ${cert.progress.total} modules complete`}
                              aria-valuemax={cert.progress.total}
                              aria-valuemin="0"
                              aria-valuenow={cert.progress.completed}
                              role="progressbar"
                            >
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${
                                    (cert.progress.completed /
                                      cert.progress.total) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                              {cert.progress.note}
                            </p>
                          </div>
                        )}

                        {cert.credentialId && (
                          <p className="mt-1 text-sm text-gray-500">
                            Credential ID: {cert.credentialId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20">
          <SectionHeading
            title="Contact"
            subtitle="Open to software engineering internships, research, and collaboration."
          />

          <Reveal className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Get in Touch
                </h3>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Location:</strong> Houston, TX
                  </p>

                  <p className="flex items-center gap-2 flex-wrap">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:Amrinderbalharjob@gmail.com"
                      onClick={() =>
                        trackEvent(
                          "Contact",
                          "Click",
                          "Contact Section Email"
                        )
                      }
                      className="break-all text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                    >
                      Amrinderbalharjob@gmail.com
                    </a>
                    <CopyEmailButton />
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    <a
                      href="tel:+18322634489"
                      onClick={() =>
                        trackEvent("Contact", "Click", "Phone Number")
                      }
                      className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                    >
                      (832) 263-4489
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Links
                </h3>

                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/Amuo007"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackEvent("Contact", "Click", "Contact GitHub")
                    }
                    className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                  >
                    GitHub
                  </a>

                  <a
                    href="https://www.linkedin.com/in/amrinder-singh-uh-computer-science/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackEvent("Contact", "Click", "Contact LinkedIn")
                    }
                    className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                  >
                    LinkedIn
                  </a>

                  <a
                    href="mailto:Amrinderbalharjob@gmail.com"
                    onClick={() =>
                      trackEvent("Contact", "Click", "Email Me Link")
                    }
                    className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                  >
                    Email Me
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <BackToTop />

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Amrinder Singh. Built with React and
          Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}
