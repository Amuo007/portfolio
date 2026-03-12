import { useState, useEffect } from "react";

const GITHUB_USERNAME = "Amuo007";

// Repos to exclude (optional - add repo names you don't want shown)
const EXCLUDED_REPOS = [];

export default function App() {
  const [activeSection, setActiveSection] = useState('about');
  const [repos, setRepos] = useState([]);
  const [repoReadmes, setRepoReadmes] = useState({});
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState(null);
  const [loadingReadme, setLoadingReadme] = useState(null);

  // Fetch all public repos
  useEffect(() => {
    if (activeSection === 'projects') {
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
        .filter(repo => !repo.fork && !EXCLUDED_REPOS.includes(repo.name))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setRepos(filtered);
    } catch (err) {
      console.error("Failed to fetch repos:", err);
    }
    setLoadingRepos(false);
  };

  const fetchReadme = async (repoName) => {
    if (repoReadmes[repoName] !== undefined) {
      // Already fetched
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
        setRepoReadmes(prev => ({ ...prev, [repoName]: text }));
      } else {
        setRepoReadmes(prev => ({ ...prev, [repoName]: null }));
      }
    } catch {
      setRepoReadmes(prev => ({ ...prev, [repoName]: null }));
    }
    setLoadingReadme(null);
    setExpandedRepo(repoName);
  };

  const toggleRepo = (repoName) => {
    if (expandedRepo === repoName) {
      setExpandedRepo(null);
    } else {
      fetchReadme(repoName);
    }
  };

  // Simple markdown-to-HTML for README display (handles headers, bold, code, links, lists)
  const renderMarkdown = (md) => {
    if (!md) return "<p class='text-gray-500 italic'>No README found for this repository.</p>";

    let html = md
      // Escape HTML
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-800 mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-5 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-pink-600 px-1 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline">$1</a>')
      // Bullet lists
      .replace(/^\s*[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 text-sm">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 text-sm">$1</li>')
      // Line breaks for double newlines
      .replace(/\n\n/g, '</p><p class="text-gray-700 text-sm mb-2">')
      // Single newlines
      .replace(/\n/g, '<br/>');

    return `<p class="text-gray-700 text-sm mb-2">${html}</p>`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getLanguageColor = (lang) => {
    const colors = {
      JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
      Swift: '#F05138', Java: '#b07219', 'C++': '#f34b7d',
      HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8', Rust: '#dea584',
      Ruby: '#701516', Kotlin: '#A97BFF', Dart: '#00B4AB',
    };
    return colors[lang] || '#8b949e';
  };

  const skills = {
    "Programming Languages": ["Swift", "Java", "JavaScript", "Python", "C++"],
    "Mobile Development": ["iOS (UIKit, SwiftUI)", "Core Data", "ARKit", "Android"],
    "Web Technologies": ["React", "Node.js", "Express.js", "HTML5", "CSS3", "Bootstrap"],
    "Databases & Cloud": ["PostgreSQL", "MongoDB", "Firebase", "Microsoft Azure"],
    "Tools & APIs": ["Git/GitHub", "Docker", "REST APIs", "OAuth 2.0", "OpenAI GPT API"]
  };

  const certifications = [
    "The Complete Full-Stack Web Development Bootcamp (Dr. Angela Yu) - 100% Complete",
    "iOS & Swift - The Complete iOS App Development Bootcamp (Dr. Angela Yu) - 100% Complete",
    "Tensorflow 2: Deep Learning & Artificial Intelligence (Lazy Programmer Inc.) - 99% Complete"
  ];

  const NavButton = ({ section, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(section)}
      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105'
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

  const RepoCard = ({ repo }) => {
    const isExpanded = expandedRepo === repo.name;
    const isLoading = loadingReadme === repo.name;
    const readme = repoReadmes[repo.name];

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        <div className="p-6">
          {/* Top Row */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {repo.stargazers_count}
                </span>
              )}
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                Updated {formatDate(repo.updated_at)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 min-h-[2rem]">
            {repo.description || <span className="italic text-gray-400">No description provided</span>}
          </p>

          {/* Topics */}
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {repo.topics.map(topic => (
                <span key={topic} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200">
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              {repo.language && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              )}
              {repo.forks_count > 0 && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  {repo.forks_count}
                </span>
              )}
            </div>
            <button
              onClick={() => toggleRepo(repo.name)}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isExpanded
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isExpanded ? 'Hide README' : 'View README'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* README Drawer */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

  const renderContent = () => {
    switch (activeSection) {
      case 'about':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">About Me</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  I'm a dedicated Computer Science student at the University of Houston, expected to graduate in May 2026.
                  With a passion for creating innovative solutions, I specialize in iOS and Android mobile development,
                  full-stack web development, and AI integration.
                </p>
                <p className="leading-relaxed">
                  My experience spans across multiple domains including voice-enabled applications, enterprise-level
                  systems, and intelligent web platforms. I love tackling complex problems and turning ideas into
                  functional, user-friendly applications.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Education</h3>
              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-lg font-semibold text-gray-900">University of Houston</h4>
                <p className="text-gray-700">Bachelor of Science, Computer Science</p>
                <p className="text-gray-600">Expected May 2026</p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Relevant Coursework:</strong> Data Structures & Algorithms, Operating Systems,
                  Database Systems, Software Engineering, Software Design, Computer Networking
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📍</span>
                  <span>Houston, TX 77084</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📧</span>
                  <a href="mailto:Amrinderbalharjob@gmail.com" className="text-blue-600 hover:underline">
                    Amrinderbalharjob@gmail.com
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📱</span>
                  <span>(832) 263-4489</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">GitHub Projects</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Live from{" "}
                  <a
                    href={`https://github.com/${GITHUB_USERNAME}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    @{GITHUB_USERNAME}
                  </a>
                  {" "}· Updates automatically when you push new repos
                </p>
              </div>
              <button
                onClick={fetchRepos}
                className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {loadingRepos ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-100 rounded-full w-16" />
                      <div className="h-6 bg-gray-100 rounded-full w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p>No repositories found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">{repos.length} public repositories</p>
                {repos.map(repo => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Technical Skills</h2>
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
        );

      case 'certifications':
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Certifications & Achievements</h2>
            <div className="space-y-4">
              {certifications.map((cert, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-6 py-3">
                  <div className="flex items-start">
                    <span className="text-green-600 mr-3 mt-1">🏆</span>
                    <p className="text-gray-700 leading-relaxed">{cert}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            <img
              src="https://media.licdn.com/dms/image/v2/D5603AQGZQQawJzY-jg/profile-displayphoto-shrink_400_400/B56ZUAo3ERHoAs-/0/1739472466551?e=1774483200&v=beta&t=iXV43y4lRs27DmqvdBw1GzFgZEleC1BsTAPF5c7qCcQ"
              alt="Amrinder Singh"
              className="w-32 h-32 rounded-full border-4 border-blue-500 object-cover shadow-lg"
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Amrinder Singh</h1>
              <p className="text-xl text-gray-600 mb-4">Computer Science Student | Full-Stack Developer</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <a
                  href="https://github.com/Amuo007"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/amrinder-singh-uh-computer-science/"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:Amrinderbalharjob@gmail.com"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                >
                  Email Me
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-t border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-center gap-4">
            <NavButton section="about" label="About" isActive={activeSection === 'about'} onClick={setActiveSection} />
            <NavButton section="projects" label="Projects" isActive={activeSection === 'projects'} onClick={setActiveSection} />
            <NavButton section="skills" label="Skills" isActive={activeSection === 'skills'} onClick={setActiveSection} />
            <NavButton section="certifications" label="Certifications" isActive={activeSection === 'certifications'} onClick={setActiveSection} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-300">© 2025 Amrinder Singh. Built with React and Tailwind CSS.</p>
          <p className="text-gray-400 text-sm mt-2">Available for internship opportunities and collaboration</p>
        </div>
      </footer>
    </div>
  );
}
