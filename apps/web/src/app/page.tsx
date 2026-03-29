export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Fund the future, together.
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          OS Interact connects visionary creators with backers who believe in
          innovative ideas. Discover projects that matter.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/projects"
            className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition"
          >
            Explore Projects
          </a>
          <a
            href="/projects/new"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Start a Campaign
          </a>
        </div>
      </section>
    </main>
  );
}
