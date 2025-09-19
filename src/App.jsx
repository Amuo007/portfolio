import { useState } from "react";

export default function App() {
  const [activeSection, setActiveSection] = useState('about');

  const projects = [
    {
      title: "SiriMind iOS App",
      period: "May 2024 - August 2024",
      type: "Independent Project",
      description: "Voice-enabled iOS application integrating OpenAI GPT API for intelligent conversational interface",
      highlights: [
        "Implemented Firebase authentication supporting 100+ test users",
        "Designed responsive UI using UIKit with speech-to-text functionality",
        "Integrated secure data management system"
      ],
      tech: ["Swift", "UIKit", "OpenAI API", "Firebase", "iOS"]
    },
    {
      title: "SpringAI Web Tour Builder",
      period: "January 2024 - May 2024", 
      type: "Independent Project",
      description: "Full-stack web platform auto-generating interactive onboarding tours using Anthropic Claude API",
      highlights: [
        "Integrated Microsoft OAuth authentication",
        "Managed deployment for 50+ demonstration projects",
        "Created dynamic tour generation with analytics dashboard"
      ],
      tech: ["React", "Node.js", "Anthropic Claude API", "OAuth", "Web Development"]
    },
    {
      title: "User Management System",
      period: "August 2023 - December 2023",
      type: "Software Engineering Course",
      description: "Enterprise-level user management system with role-based access control",
      highlights: [
        "Collaborated with 4-member team using Agile methodology",
        "Designed RESTful API endpoints with secure authentication",
        "Built responsive dashboards with real-time data synchronization"
      ],
      tech: ["JavaScript", "REST API", "Team Collaboration", "Full-Stack"]
    },
    {
      title: "Task Manager iOS App",
      period: "August 2024 - December 2024",
      type: "Mobile Application Development Course", 
      description: "Native iOS task management application with Core Data persistence",
      highlights: [
        "Achieved 20% performance improvement in loading times",
        "Implemented CRUD operations with local notifications",
        "Built clean architecture with data export functionality"
      ],
      tech: ["Swift", "Core Data", "iOS", "UIKit", "Performance Optimization"]
    },
    {
      title: "Weather Forecast App",
      period: "January 2024 - May 2024",
      type: "Independent Project",
      description: "iOS weather application with real-time API integration and location services",
      highlights: [
        "Integrated MapKit achieving 95% uptime with GPS tracking",
        "Designed intuitive UI with weather visualizations",
        "Implemented 7-day forecast capabilities"
      ],
      tech: ["Swift", "MapKit", "Weather API", "Location Services", "iOS"]
    }
  ];

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

  const ProjectCard = ({ project }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          {project.type}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{project.period}</p>
      <p className="text-gray-700 mb-4">{project.description}</p>
      
      <div className="space-y-2 mb-4">
        {project.highlights.map((highlight, idx) => (
          <div key={idx} className="flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span className="text-gray-700 text-sm">{highlight}</span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {project.tech.map((tech, idx) => (
          <SkillTag key={idx} skill={tech} />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Project Portfolio</h2>
            {projects.map((project, idx) => (
              <ProjectCard key={idx} project={project} />
            ))}
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
              src="https://media.licdn.com/dms/image/v2/D5603AQGZQQawJzY-jg/profile-displayphoto-shrink_800_800/B56ZUAo3ERHoAo-/0/1739472466551?e=1761177600&v=beta&t=cDP9uIILxbCSqihI1JvZocbjIqUStsDo6r_RkokoVug"
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
            <NavButton 
              section="about" 
              label="About" 
              isActive={activeSection === 'about'} 
              onClick={setActiveSection}
            />
            <NavButton 
              section="projects" 
              label="Projects" 
              isActive={activeSection === 'projects'} 
              onClick={setActiveSection}
            />
            <NavButton 
              section="skills" 
              label="Skills" 
              isActive={activeSection === 'skills'} 
              onClick={setActiveSection}
            />
            <NavButton 
              section="certifications" 
              label="Certifications" 
              isActive={activeSection === 'certifications'} 
              onClick={setActiveSection}
            />
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
          <p className="text-gray-300">
            © 2025 Amrinder Singh. Built with React and Tailwind CSS.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Available for internship opportunities and collaboration
          </p>
        </div>
      </footer>
    </div>
  );
}