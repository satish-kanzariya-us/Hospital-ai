"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/",             label: "Home",      icon: "🏠" },
  { href: "/dashboard",    label: "Dashboard", icon: "📊" },
  { href: "/queue",        label: "Smart Queue",      icon: "🎫" },
  { href: "/receptionist", label: "Receptionist",    icon: "🏥" },
  { href: "/recommend",    label: "Recommendations", icon: "🏆" },
  { href: "/chat",         label: "AI Assistant", icon: "🤖" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <aside className="w-56 min-h-screen sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
          className="text-3xl"
        >
          🏥
        </motion.div>
        <div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Queue AI
          </span>
          <div>
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              LIVE
            </span>
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                path === l.href
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
            </motion.div>
          </Link>
        ))}
      </nav>

      {/* Footer hint */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Queue AI &copy; 2025</p>
      </div>
    </aside>
  );
}
