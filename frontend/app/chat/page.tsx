"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/api";

const CITIES      = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];
const SUGGESTIONS = [
  "Which hospital has the least wait in Delhi?",
  "Is it a good time to visit right now?",
  "I need a cardiologist in Mumbai",
  "I have chest pain, what should I do?",
  "Compare hospitals in Bangalore",
];

interface Message { role: "user" | "assistant"; text: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm HospitalAI 🤖\n\nTell me your city and what you need — I'll find the shortest queue and best hospital for you." },
  ]);
  const [input, setInput]     = useState("");
  const [city, setCity]       = useState("Delhi");
  const [specialty, setSpecialty] = useState("General");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChatMessage(text, { city, specialty });
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "Sorry, I could not get a response." }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "I'm having trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">
          🤖 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Assistant</span>
        </h1>
        <p className="text-gray-500 text-sm">Ask anything about hospital wait times and queues.</p>
      </motion.div>

      {/* Context row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-3"
      >
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📍</span>
          <select
            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none shadow-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🩺</span>
          <select
            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none shadow-sm"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto bg-white border border-gray-100 rounded-2xl p-4 space-y-3 mb-3 shadow-md">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md shadow-blue-100"
                    : "bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                AI
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-3"
        >
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(s)}
              className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full hover:border-purple-400 transition-colors"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="flex gap-2"
      >
        <input
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none shadow-sm"
          placeholder="Ask about wait times, hospitals, queues..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <motion.button
          type="submit"
          disabled={loading || !input.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 shadow-md shadow-purple-200"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : "Send ↑"}
        </motion.button>
      </motion.form>
    </div>
  );
}
