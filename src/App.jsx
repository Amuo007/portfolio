import { useState, useEffect } from "react";

const GITHUB_USERNAME = "Amuo007";
const EXCLUDED_REPOS = [];

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [repos, setRepos] = useState([]);
  const [repoDetails, setRepoDetails] = useState({});
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState(null);
  const [loadingReadme, setLoadingReadme] = useState(null);

  useEffect(() => {
    if (activeSection === "github") {
      fetchRepos();
    }
  }, [activeSection]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
      );
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
    }
    setLoadingRepos(false);
  };

  const extractSummary = (md) => {
    if (!md) return null;
    const lines = md.split("\n");

    for (let line of lines) {
      const trimmed = line.trim();

      if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("!") ||
        trimmed.startsWith("<") ||
        trimmed.startsWith("```") ||
        trimmed.startsWith("|") ||
        trimmed.startsWith("---") ||
        trimmed.startsWith("===") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("-")
      )
        continue;

      const clean = trimmed
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/~~(.+?)~~/g, "$1")
        .trim();

      if (clean.length > 20) {
        return clean.length > 200 ? clean.slice(0, 200) + "…" : clean;
      }
    }

    return null;
  };

  const fetchReadmeSummary = async (repoName) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
        { headers: { Accept: "application/vnd.github.raw" } }
      );

      if (res.ok) {
        const text = await res.text();
        const summary = extractSummary(text);
        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: { ...prev[repoName], readme: text, summary },
        }));
      } else {
        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: { ...prev[repoName], readme: null, summary: null },
        }));
      }
    } catch {
      setRepoDetails((prev) => ({
        ...prev,
        [repoName]: { ...prev[repoName], readme: null, summary: null },
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
        { headers: { Accept: "application/vnd.github.raw" } }
      );

      if (res.ok) {
        const text = await res.text();
        const summary = extractSummary(text);
        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: { ...prev[repoName], readme: text, summary },
        }));
      } else {
        setRepoDetails((prev) => ({
          ...prev,
          [repoName]: { ...prev[repoName], readme: null, summary: null },
        }));
      }
    } catch {
      setRepoDetails((prev) => ({
        ...prev,
        [repoName]: { ...prev[repoName], readme: null, summary: null },
      }));
    }

    setLoadingReadme(null);
    setExpandedRepo(repoName);
  };

  const toggleReadme = (repoName) => {
    if (expandedRepo === repoName) {
      setExpandedRepo(null);
    } else {
      fetchFullReadme(repoName);
    }
  };

  const renderMarkdown = (md) => {
    if (!md)
      return "<p class='text-gray-500 italic'>No README found for this repository.</p>";

    let html = md
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
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">$1</a>'
      )
      .replace(/^\s*[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 text-sm">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 text-sm">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-gray-700 text-sm mb-2">')
      .replace(/\n/g, "<br/>");

    return `<p class="text-gray-700 text-sm mb-2">${html}</p>`;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

  const getLanguageColor = (lang) => {
    const colors = {
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

    return colors[lang] || "#8b949e";
  };

  const featuredProjects = [
    {
      title: "Offline RAG Search for Internet-in-a-Box",
      subtitle: "Research Project",
      description:
        "Exploring how embeddings and retrieval-augmented generation can improve offline educational search for Internet-in-a-Box, while evaluating performance on low-end Android devices.",
      tech: ["RAG", "Embeddings", "JavaScript", "Android", "IIAB"],
      github: "https://github.com/Amuo007/iiab",
      image: "/poster.jpg",
    },
    {
      title: "AR Development for Meta Quest 3",
      subtitle: "Internship / Team Project",
      description:
        "Contributed to immersive AR application development for Meta Quest 3 using Unity-based workflows and engineering collaboration.",
      tech: ["Unity", "C#", "JavaScript", "Meta Quest 3", "AR"],
      github: "#",
      image:
        "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Full-Stack & Mobile Engineering Portfolio",
      subtitle: "Personal Engineering Work",
      description:
        "A collection of full-stack, iOS, and software projects focused on building practical solutions and learning across web, mobile, and AI systems.",
      tech: ["React", "Node.js", "Swift", "Firebase", "GitHub API"],
      github: "https://github.com/Amuo007",
      image:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const experiences = [
    {
      role: "Software Engineer Intern",
      company: "Geometris LP",
      type: "Full-time",
      dates: "May 2026 – Present",
      duration: "1 mo",
      location: "10010 Houston Oaks Dr, Houston, TX 77064",
      workMode: "On-site",
      description: [
        "Working in a professional software engineering environment on real development tasks and internal engineering workflows.",
        "Contributing to debugging, feature improvements, and application-related tasks.",
        "Gaining hands-on experience collaborating with engineers and working with production-oriented systems.",
      ],
      skills: ["Software Engineering", "JavaScript", "React", "Debugging"],
      image: "https://raw.githubusercontent.com/Amuo007/portfolio/refs/heads/main/intern.jpg",
      logo: "G",
      logoColor: "bg-blue-600",
    },
    {
      role: "Undergraduate Student Researcher",
      company: "University of Houston",
      type: "Full-time",
      dates: "Jan 2026 – Present",
      duration: "5 mos",
      location: "United States",
      workMode: "On-site",
      description: [
        "Working on Internet-in-a-Box and exploring ways to improve search using embeddings and retrieval-augmented generation (RAG).",
        "Evaluating how offline search and AI-assisted retrieval perform on low-end, low-cost Android devices.",
        "Focusing on practical educational use cases for environments with limited internet access.",
      ],
      skills: ["RAG", "Embeddings", "Android", "Educational Research", "IIAB"],
      image: "https://raw.githubusercontent.com/Amuo007/portfolio/refs/heads/main/poster.jpg",
      logo: "UH",
      logoColor: "bg-red-600",
    },
    {
      role: "Software Engineer",
      company: "Stealth",
      type: "Internship",
      dates: "Jan 2026 – May 2026",
      duration: "5 mos",
      location: "United States",
      workMode: "Remote",
      description: [
        "Contributed to an AR development team building applications for Meta Quest 3.",
        "Supported Unity-based development workflows for immersive application features.",
        "Collaborated in a remote engineering environment to help deliver AR-related functionality.",
      ],
      skills: ["Unity", "C#", "JavaScript", "AR Development", "Meta Quest 3"],
      image: null,
      logo: "S",
      logoColor: "bg-gray-900",
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

  const NavButton = ({ section, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(section)}
      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
        isActive
          ? "bg-blue-600 text-white shadow-lg transform scale-105"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
      }`}
    >
      {label}
    </button>
  );

  const SkillTag = ({ skill }) => (
    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
      {skill}
    </span>
  );

  const SectionHeading = ({ title, subtitle }) => (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );

  const RepoCard = ({ repo }) => {
    const isExpanded = expandedRepo === repo.name;
    const isLoading = loadingReadme === repo.name;
    const details = repoDetails[repo.name];
    const readme = details?.readme;
    const description = repo.description || details?.summary;
    const summaryLoading = !repo.description && details === undefined;

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>

              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-lg font-bold text-blue-700 hover:underline"
              >
                {repo.name}
              </a>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {repo.stargazers_count}
                </span>
              )}

              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {formatDate(repo.updated_at)}
              </span>
            </div>
          </div>

          <div className="mb-4 min-h-[1.5rem]">
            {summaryLoading ? (
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
            ) : description ? (
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">No description available</p>
            )}
          </div>

          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {repo.topics.map((topic) => (
                <span
                  key={topic}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              {repo.language && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              )}

              {repo.forks_count > 0 && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    />
                  </svg>
                  {repo.forks_count}
                </span>
              )}
            </div>

            <button
              onClick={() => toggleReadme(repo.name)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isExpanded
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isExpanded ? "Hide README" : "Full README"}
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-700">README.md</span>
            </div>

            <div
              className="prose prose-sm max-w-none text-gray-700 max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderHome = () => (
    <div className="space-y-10">
      <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-blue-600 font-semibold mb-3">
              Software Engineer Intern · Computer Science Student
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Amrinder Singh
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Full-Stack, AI, and AR Developer
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Computer Science student at the University of Houston building
              full-stack, AI, and AR applications. Currently working as a
              Software Engineer Intern at Geometris LP and researching offline
              search using embeddings and RAG for Internet-in-a-Box.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveSection("projects")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                View Projects
              </button>
              <button
                onClick={() => setActiveSection("experience")}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all"
              >
                View Experience
              </button>
              <a
                href="https://github.com/Amuo007"
                target="_blank"
                rel="noreferrer"
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="https://github.com/Amuo007/portfolio/blob/main/profile.jpeg?raw=true"
              alt="Amrinder Singh"
              className="w-72 h-72 rounded-2xl object-cover border-4 border-blue-500 shadow-xl"
            />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Current Role</h3>
          <p className="text-gray-700">Software Engineer Intern at Geometris LP</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Research</h3>
          <p className="text-gray-700">Offline Search, Embeddings, and RAG for IIAB</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Focus</h3>
          <p className="text-gray-700">Full-Stack Development, AR, AI Systems</p>
        </div>
      </section>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-10">
      <SectionHeading
        title="Featured Projects"
        subtitle="Highlighted work that best represents my software engineering, research, and development experience."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {featuredProjects.map((project, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
          >
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-52 object-cover"
            />

            <div className="p-6">
              <p className="text-sm text-blue-600 font-semibold mb-2">
                {project.subtitle}
              </p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {project.title}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {project.tech.map((item, i) => (
                  <SkillTag key={i} skill={item} />
                ))}
              </div>

              <div className="flex gap-3">
                {project.github !== "#" && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-10">
      <SectionHeading
        title="Experience"
        subtitle="Professional, research, and internship experience."
      />

      <div className="space-y-6">
        {experiences.map((exp, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-1 bg-gray-50 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-200">
                {exp.image ? (
                  <img
                    src={exp.image}
                    alt={exp.company}
                    className="w-full max-w-xs h-52 object-cover rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-full max-w-xs h-52 rounded-xl shadow-md flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white">
                    <div className="text-center">
                      <div
                        className={`w-16 h-16 ${exp.logoColor} rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4`}
                      >
                        {exp.logo}
                      </div>
                      <p className="text-lg font-semibold">{exp.company}</p>
                      <p className="text-sm text-gray-200 mt-1">{exp.type}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-12 h-12 ${exp.logoColor} rounded-full flex items-center justify-center text-white font-bold`}
                      >
                        {exp.logo}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {exp.role}
                        </h3>
                        <p className="text-blue-700 font-semibold">
                          {exp.company} · {exp.type}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm">
                      {exp.location} · {exp.workMode}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <span className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full border border-blue-100">
                      {exp.dates}
                    </span>
                    <p className="text-gray-400 text-sm mt-2">{exp.duration}</p>
                  </div>
                </div>

                <ul className="space-y-2 text-gray-700 mb-5">
                  {exp.description.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {exp.skills.map((skill, skillIdx) => (
                    <SkillTag key={skillIdx} skill={skill} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-8">
      <SectionHeading
        title="Skills"
        subtitle="Core technologies and tools I use across software, web, mobile, AI, and AR development."
      />

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-6">
          {Object.entries(skills).map(([category, skillList]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {skillList.map((skill, idx) => (
                  <SkillTag key={idx} skill={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-8">
      <SectionHeading
        title="Education"
        subtitle="Academic background and relevant coursework."
      />

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="border-l-4 border-blue-600 pl-6">
          <h3 className="text-2xl font-bold text-gray-900">University of Houston</h3>
          <p className="text-gray-700 text-lg mt-1">Bachelor of Science in Computer Science</p>
          <p className="text-gray-500 mt-1">Expected Graduation: May 2026</p>

          <p className="text-gray-700 mt-4 leading-relaxed">
            Relevant coursework includes Data Structures & Algorithms, Operating Systems,
            Database Systems, Software Engineering, Software Design, and Computer Networking.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCertifications = () => (
    <div className="space-y-8">
      <SectionHeading
        title="Licenses & Certifications"
        subtitle="Courses, training, and credentials that support my software engineering background."
      />

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-4">
          {certifications.map((cert, idx) => (
            <div key={idx} className="border-l-4 border-green-500 pl-6 py-3">
              <div className="flex items-start">
                <span className="text-green-600 mr-3 mt-1">🏆</span>
                <div>
                  <p className="text-gray-900 font-semibold">{cert.title}</p>
                  <p className="text-gray-600 text-sm">
                    {cert.issuer} · Issued {cert.issued}
                  </p>
                  {cert.credentialId && (
                    <p className="text-gray-500 text-sm mt-1">
                      Credential ID: {cert.credentialId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGitHub = () => (
    <div className="space-y-8">
      <SectionHeading
        title="More GitHub Projects"
        subtitle="Additional public repositories pulled live from GitHub."
      />

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          Live from{" "}
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            @{GITHUB_USERNAME}
          </a>
        </p>

        <button
          onClick={fetchRepos}
          className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {loadingRepos ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-md">
          <p>No repositories found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">{repos.length} public repositories</p>
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );

  const renderContact = () => (
    <div className="space-y-8">
      <SectionHeading
        title="Contact"
        subtitle="If you'd like to connect, collaborate, or discuss opportunities, feel free to reach out."
      />

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h3>
            <div className="space-y-3 text-gray-700">
              <p><strong>Location:</strong> Houston, TX 77084</p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:Amrinderbalharjob@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  Amrinderbalharjob@gmail.com
                </a>
              </p>
              <p><strong>Phone:</strong> (832) 263-4489</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Links</h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/Amuo007"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/amrinder-singh-uh-computer-science/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
              <a
                href="mailto:Amrinderbalharjob@gmail.com"
                className="text-blue-600 hover:underline"
              >
                Email Me
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return renderHome();
      case "projects":
        return renderProjects();
      case "experience":
        return renderExperience();
      case "skills":
        return renderSkills();
      case "education":
        return renderEducation();
      case "certifications":
        return renderCertifications();
      case "github":
        return renderGitHub();
      case "contact":
        return renderContact();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Amrinder Singh</h1>
              <p className="text-gray-600 text-sm">
                Software Engineer Intern | Computer Science Student
              </p>
            </div>

            <nav className="flex flex-wrap gap-3">
              <NavButton
                section="home"
                label="Home"
                isActive={activeSection === "home"}
                onClick={setActiveSection}
              />
              <NavButton
                section="projects"
                label="Projects"
                isActive={activeSection === "projects"}
                onClick={setActiveSection}
              />
              <NavButton
                section="experience"
                label="Experience"
                isActive={activeSection === "experience"}
                onClick={setActiveSection}
              />
              <NavButton
                section="skills"
                label="Skills"
                isActive={activeSection === "skills"}
                onClick={setActiveSection}
              />
              <NavButton
                section="education"
                label="Education"
                isActive={activeSection === "education"}
                onClick={setActiveSection}
              />
              <NavButton
                section="certifications"
                label="Certifications"
                isActive={activeSection === "certifications"}
                onClick={setActiveSection}
              />
              <NavButton
                section="github"
                label="GitHub"
                isActive={activeSection === "github"}
                onClick={setActiveSection}
              />
              <NavButton
                section="contact"
                label="Contact"
                isActive={activeSection === "contact"}
                onClick={setActiveSection}
              />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">{renderContent()}</main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-300">
            © 2026 Amrinder Singh. Built with React and Tailwind CSS.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Available for internship opportunities, research, and collaboration
          </p>
        </div>
      </footer>
    </div>
  );
}
