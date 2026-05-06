"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/queue", label: "My Queue", icon: "🎫" },
  { href: "/receptionist", label: "Staff", icon: "🏥" },
  { href: "/dashboard", label: "Predict", icon: "📊" },
  { href: "/recommend", label: "Recommend", icon: "🏆" },
  { href: "/chat", label: "AI Chat", icon: "🤖" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
            className="text-3xl"
          >
            🏥
          </motion.div>
          <div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              HospitalAI
            </span>
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              LIVE
            </span>
          </div>
        </Link>

        <div className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  path === l.href
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-600 hover:bg-white/80 hover:text-blue-600"
                }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
