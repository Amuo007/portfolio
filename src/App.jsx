import { useEffect, useState } from "react";

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

const trackEvent = (category, action, name) => {
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(["trackEvent", category, action, name]);
  }
};

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
      '<code class="bg-gray-100 text-pink-600 px-1 rounded text-sm font-mono">$1</code>'
    )
    .replace(
      MARKDOWN_LINK_REGEX,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-red-600 hover:underline">$1</a>'
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
    image:
      "https://raw.githubusercontent.com/Amuo007/portfolio/refs/heads/main/intern.jpg",
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
    image:
      "https://raw.githubusercontent.com/Amuo007/portfolio/refs/heads/main/poster.jpg",
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

const certifications = [
  {
    title: "Complete Data Science & Machine Learning Bootcamp",
    issuer: "Udemy",
    issued: "Jan 2022",
  },
  {
    title: "Tensorflow 2: Deep Learning & Artificial Intelligence",
    issuer: "Udemy",
    issued: "May 2024",
  },
  {
    title: "iOS & Swift - The Complete iOS App Development Bootcamp",
    issuer: "Udemy",
    issued: "Dec 2023",
  },
  {
    title: "The Complete Full-Stack Web Development Bootcamp",
    issuer: "Udemy",
    issued: "May 2022",
  },
  {
    title: "Electronic Arts - Software Engineering Job Simulation",
    issuer: "Forage",
    issued: "Feb 2025",
    credentialId: "69W4vPnb6zwW6gq75",
  },
];

const NavLink = ({ href, label }) => (
  <a
    href={href}
    onClick={() => trackEvent("Navigation", "Click", label)}
    className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-2.5 py-2 md:px-3 whitespace-nowrap"
  >
    {label}
  </a>
);

const SkillTag = ({ skill }) => (
  <span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full text-xs font-medium">
    {skill}
  </span>
);

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
  </div>
);

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              onClick={handleRepositoryClick}
              className="text-xl font-bold text-gray-900 hover:text-red-600"
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
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
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
          className="text-sm text-red-600 hover:underline font-medium"
        >
          {isLoading
            ? "Loading README..."
            : isExpanded
              ? "Hide README"
              : "View README"}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
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

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    setRepoError(false);

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
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      setRepos(filtered);

      filtered.forEach((repo) => {
        if (!repo.description) {
          fetchReadmeSummary(repo.name);
        }
      });
    } catch (err) {
      console.error("Failed to fetch repos:", err);
      setRepoError(true);
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchReadmeSummary = async (repoName) => {
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

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: text,
            summary,
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

        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            readme: text,
            summary,
          },
        }));
      } else {
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
          <a
            href="#home"
            onClick={() => trackEvent("Navigation", "Click", "Home")}
            className="font-bold text-xl text-gray-900 px-2.5 md:px-0 py-1 md:py-0"
          >
            Amrinder Singh
          </a>

          <nav className="no-scrollbar flex overflow-x-auto md:overflow-visible -mx-4 px-1.5 md:mx-0 md:px-0 gap-0 md:gap-2">
            <NavLink href="#experience" label="Experience" />
            <NavLink href="#projects" label="Projects" />
            <NavLink href="#skills" label="Skills" />
            <NavLink href="#education" label="Education" />
            <NavLink href="#contact" label="Contact" />
          </nav>
        </div>
      </header>

      <main>
        <section id="home" className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <img
                src="https://github.com/Amuo007/portfolio/blob/main/profile.jpeg?raw=true"
                alt="Portrait of Amrinder Singh"
                className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-red-600 shadow-md"
              />

              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-2">
                  Software Engineer Intern · Computer Science Student
                </p>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                  Amrinder Singh
                </h1>

                <p className="text-xl text-gray-600 mb-4">
                  Full-Stack, AI, and AR Developer
                </p>

                <p className="text-gray-700 leading-relaxed max-w-3xl mb-6">
                  Computer Science student at the University of Houston building
                  full-stack, AI, and AR applications. Currently working as a
                  Software Engineer Intern at Geometris LP. Previously researched
                  offline search using embeddings and RAG for Internet-in-a-Box.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#projects"
                    onClick={() =>
                      trackEvent("Hero", "Click", "View Projects")
                    }
                    className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    View Projects
                  </a>

                  <a
                    href="#experience"
                    onClick={() =>
                      trackEvent("Hero", "Click", "View Experience")
                    }
                    className="bg-white text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className="bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
                    className="bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
                    className="bg-white text-gray-700 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="max-w-6xl mx-auto px-6 py-12">
          <SectionHeading
            title="Experience"
            subtitle="Professional, research, and internship experience."
          />

          <div className="space-y-6">
            {experiences.map((exp) => (
              <div
                key={`${exp.company}-${exp.role}`}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-shrink-0">
                    {exp.image ? (
                      <img
                        src={exp.image}
                        alt={exp.company}
                        loading="lazy"
                        className="w-full md:w-40 h-48 md:h-28 object-cover rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-full md:w-40 h-28 rounded-xl bg-gray-900 text-white flex items-center justify-center">
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

                        <p className="text-red-700 font-semibold">
                          {exp.company} · {exp.type}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          {exp.location}
                        </p>
                      </div>

                      <span className="text-sm bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full w-fit">
                        {exp.dates}
                      </span>
                    </div>

                    <ul className="space-y-2 text-gray-700 text-sm mb-4">
                      {exp.description.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-red-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {exp.skills.map((skill) => (
                        <SkillTag key={skill} skill={skill} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="max-w-6xl mx-auto px-6 py-12">
          <SectionHeading
            title="Projects"
            subtitle="Public GitHub repositories pulled live from my GitHub profile."
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
                className="text-red-600 hover:underline font-medium"
              >
                @{GITHUB_USERNAME}
              </a>
            </p>

            <button
              type="button"
              onClick={() => {
                trackEvent("Projects", "Click", "Refresh Repositories");
                fetchRepos();
              }}
              className="text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loadingRepos ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : repoError ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-600 mb-4">
                Couldn't load repositories from GitHub right now.
              </p>
              <button
                type="button"
                onClick={() => {
                  trackEvent("Projects", "Click", "Retry Repositories");
                  fetchRepos();
                }}
                className="text-sm bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
              No repositories found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {repos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isExpanded={expandedRepo === repo.name}
                  isLoading={loadingReadme === repo.name}
                  details={repoDetails[repo.name]}
                  onToggleReadme={toggleReadme}
                />
              ))}
            </div>
          )}
        </section>

        <section id="skills" className="max-w-6xl mx-auto px-6 py-12">
          <SectionHeading
            title="Skills"
            subtitle="Technologies I use across software, web, mobile, AI, and AR development."
          />

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(skills).map(([category, skillList]) => (
                <div key={category}>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">
                    {category}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {skillList.map((skill) => (
                      <SkillTag key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="education" className="max-w-6xl mx-auto px-6 py-12">
          <SectionHeading
            title="Education & Certifications"
            subtitle="Academic background and software-related training."
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900">
                University of Houston
              </h3>

              <p className="text-gray-700 mt-1">
                Bachelor of Science in Computer Science
              </p>

              <p className="text-gray-500 mt-1">
                Expected Graduation: December 2026
              </p>

              <p className="text-gray-700 text-sm mt-4 leading-relaxed">
                Relevant coursework includes Data Structures & Algorithms,
                Operating Systems, Database Systems, Software Engineering,
                Software Design, and Computer Networking.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Certifications
              </h3>

              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div
                    key={`${cert.title}-${cert.issued}`}
                    className="border-l-4 border-red-500 pl-4"
                  >
                    <p className="font-semibold text-gray-900">{cert.title}</p>

                    <p className="text-sm text-gray-600">
                      {cert.issuer} · Issued {cert.issued}
                    </p>

                    {cert.credentialId && (
                      <p className="text-sm text-gray-500">
                        Credential ID: {cert.credentialId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="max-w-6xl mx-auto px-6 py-12 pb-20">
          <SectionHeading
            title="Contact"
            subtitle="Open to software engineering internships, research, and collaboration."
          />

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Get in Touch
                </h3>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Location:</strong> Houston, TX
                  </p>

                  <p>
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
                      className="text-red-600 hover:underline"
                    >
                      Amrinderbalharjob@gmail.com
                    </a>
                  </p>

                  <p>
                    <strong>Phone:</strong> (832) 263-4489
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
                    className="text-red-600 hover:underline"
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
                    className="text-red-600 hover:underline"
                  >
                    LinkedIn
                  </a>

                  <a
                    href="mailto:Amrinderbalharjob@gmail.com"
                    onClick={() =>
                      trackEvent("Contact", "Click", "Email Me Link")
                    }
                    className="text-red-600 hover:underline"
                  >
                    Email Me
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Amrinder Singh. Built with React and
          Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}
