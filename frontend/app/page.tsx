"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const cities = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const specialties = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

const features = [
  { icon: "⏱", title: "Wait Time Prediction", desc: "Real-time queue estimates using historical patterns + peak-hour AI.", color: "from-blue-500 to-cyan-500" },
  { icon: "🏆", title: "Smart Recommendations", desc: "Least crowded hospital ranked by wait time, rating, and occupancy.", color: "from-indigo-500 to-purple-500" },
  { icon: "🤖", title: "AI Chat Assistant",    desc: "Ask anything in plain language. Emergency detection built in.", color: "from-purple-500 to-pink-500" },
  { icon: "📊", title: "Live Simulation",       desc: "24-hour queue timeline so you know exactly when to leave home.", color: "from-pink-500 to-rose-500" },
];

const stats = [
  { value: "10+", label: "Hospitals" },
  { value: "5",   label: "Cities" },
  { value: "50",  label: "Tests Passing" },
  { value: "24h", label: "Simulation" },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-4 py-20">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply opacity-40 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply opacity-40 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply opacity-30 blur-3xl"
          />
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/80 border border-blue-200 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full mb-6 shadow-sm"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            AI-powered · Live hospital data
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-4 leading-tight"
          >
            Know before{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              you go.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-10"
          >
            Predict hospital wait times, find the shortest queue, and chat with an AI assistant — all powered by real India hospital data.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <Link href="/recommend">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37,99,235,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 text-base"
              >
                🏆 Find Best Hospital
              </motion.button>
            </Link>
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl border-2 border-blue-200 shadow-md text-base"
              >
                🤖 Ask AI Assistant
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-4 gap-4 max-w-xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-white/80 rounded-2xl p-3 shadow-sm border border-white">
                <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-gray-900">Everything you need</h2>
          <p className="text-gray-500 mt-2">Built for real patients, real hospitals, real India.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md card-hover"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl border border-gray-100 p-10 shadow-md"
        >
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">Explore by city</h2>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {cities.map((c, i) => (
              <Link key={c} href={`/recommend?city=${c}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  📍 {c}
                </motion.div>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {specialties.map((s) => (
              <span key={s} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-12 text-center text-white shadow-2xl"
        >
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
          />
          <h2 className="text-3xl font-extrabold mb-3 relative z-10">Ready to skip the queue?</h2>
          <p className="text-blue-100 mb-8 text-lg relative z-10">Select your city, pick a specialty, and let AI find the best hospital in seconds.</p>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#f0f4ff" }}
              whileTap={{ scale: 0.97 }}
              className="relative z-10 inline-block bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl shadow-lg text-base"
            >
              📊 Open Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
