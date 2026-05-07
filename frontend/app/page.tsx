"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const cities = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const specialties = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

const features = [
  { icon: "🎫", title: "Smart Token Queue",      desc: "Book a token, get your real ETA, and arrive exactly when it's your turn.", color: "from-blue-500 to-cyan-500",   href: "/queue" },
  { icon: "🏥", title: "Receptionist Dashboard", desc: "Mark attended, skip, add doctor delays — all patients update instantly.",   color: "from-indigo-500 to-purple-500", href: "/receptionist" },
  { icon: "🤖", title: "AI Chat Assistant",      desc: "Ask anything in plain language. Emergency detection built in.",            color: "from-purple-500 to-pink-500",  href: "/chat" },
  { icon: "🏆", title: "Smart Recommendations",  desc: "Least crowded hospital ranked by wait time, rating, and occupancy.",      color: "from-pink-500 to-rose-500",    href: "/recommend" },
];

export default function Home() {
  return (
    <div className="h-full px-6 py-5 flex flex-col gap-5 overflow-hidden">

      {/* Hero */}
      <section className="relative flex items-center justify-between gap-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -left-16 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply opacity-30 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -top-16 right-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply opacity-30 blur-3xl"
          />
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/80 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 shadow-sm"
          >
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            AI-powered · Live hospital data
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-gray-900 leading-tight mb-2"
          >
            Know before{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              you go.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-500 max-w-lg"
          >
            Predict hospital wait times, find the shortest queue, and chat with an AI assistant — all powered by real India hospital data.
          </motion.p>
        </div>

        <Link href="/dashboard" className="relative shrink-0">
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 text-sm whitespace-nowrap"
          >
            📊 Open Dashboard
          </motion.button>
        </Link>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <Link key={f.title} href={f.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md cursor-pointer h-full"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl mb-3 shadow-md`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          </Link>
        ))}
      </section>

      {/* Cities + Specialties */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-extrabold text-gray-700 mb-2.5">Explore by city</h2>
            <div className="flex flex-wrap gap-2">
              {cities.map((c, i) => (
                <Link key={c} href={`/recommend?city=${c}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                  >
                    📍 {c}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-extrabold text-gray-700 mb-2.5">Specialties</h2>
            <div className="flex flex-wrap gap-1.5">
              {specialties.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
