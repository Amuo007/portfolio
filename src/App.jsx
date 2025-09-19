export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <header className="text-center mb-8">
          <img
            src="https://media.licdn.com/dms/image/v2/D5603AQGZQQawJzY-jg/profile-displayphoto-shrink_800_800/B56ZUAo3ERHoAo-/0/1739472466551?e=1761177600&v=beta&t=cDP9uIILxbCSqihI1JvZocbjIqUStsDo6r_RkokoVug"
            alt="Profile"
            className="mx-auto w-32 h-32 rounded-full border-4 border-blue-500 object-cover"
          />
          <h1 className="text-3xl font-bold mt-4">Amrinder Singh</h1>
          <p className="text-gray-600">Computer Science Student | Developer</p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">About Me</h2>
          <p className="text-gray-700">
            I'm a Computer Science student at the University of Houston with
            experience in iOS, Android, and Web Development using Node.js and
            Django. I love building projects and learning new technologies.
          </p>
        </section>

        <footer className="text-center mt-8">
          <p className="text-gray-600">Connect with me:</p>
          <div className="space-x-6 mt-2">
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
          </div>
        </footer>
      </div>
    </div>
  );
}