import Link from "next/link";

const cities = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const specialties = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

const features = [
  {
    icon: "⏱",
    title: "Wait Time Prediction",
    desc: "Real-time queue estimates using our AI formula.",
  },
  {
    icon: "🏆",
    title: "Smart Recommendations",
    desc: "Least crowded hospital ranked by wait time and rating.",
  },
  {
    icon: "🤖",
    title: "AI Chat Assistant",
    desc: "Ask any hospital question and get instant guidance.",
  },
  {
    icon: "📊",
    title: "Live Dashboard",
    desc: "Occupancy %, queue lengths, and confidence scores.",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-block bg-blue-50 text-blue-600 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          AI-powered hospital intelligence
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Know before you go.
          <br />
          <span className="text-blue-600">Skip the queue.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-8">
          Predict hospital wait times, get smart recommendations, and chat with
          an AI assistant — all in one place.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/recommend"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-md"
          >
            Find Best Hospital →
          </Link>
          <Link
            href="/chat"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-full border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
          >
            Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Cities covered */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-10 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
          Hospitals across India
        </h2>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {cities.map((c) => (
            <Link
              key={c}
              href={`/recommend?city=${c}`}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              📍 {c}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {specialties.map((s) => (
            <span
              key={s}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-center text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Ready to find the shortest queue?</h2>
        <p className="text-blue-100 mb-6">
          Select your city, pick a specialty, and let AI do the rest.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors shadow"
        >
          View Hospital Dashboard
        </Link>
      </div>
    </div>
  );
}
