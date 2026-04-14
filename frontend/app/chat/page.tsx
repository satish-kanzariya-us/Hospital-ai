"use client";
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";

const CITIES = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Chandigarh"];
const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "Gynecology"];

const SUGGESTIONS = [
  "Which hospital has the least wait in Delhi?",
  "Is it a good time to visit right now?",
  "I need a cardiologist in Mumbai",
  "I have chest pain, what should I do?",
  "Compare hospitals in Bangalore for General",
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm HospitalAI, your smart hospital assistant. Tell me your city and what you need — I'll help you find the shortest queue and best hospital.",
    },
  ]);
  const [input, setInput] = useState("");
  const [city, setCity] = useState("Delhi");
  const [specialty, setSpecialty] = useState("General");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(text, { city, specialty });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "Sorry, I could not get a response." },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "I'm having trouble connecting to the server.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: msg },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">AI Chat Assistant</h1>
      <p className="text-gray-500 text-sm mb-4">Ask anything about hospital wait times, queues, and recommendations.</p>

      {/* Context selectors */}
      <div className="flex gap-3 mb-4">
        <select
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-2xl p-4 space-y-3 mb-4 shadow-sm">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {m.role === "assistant" && (
                <span className="text-xs font-semibold text-blue-600 block mb-1">🤖 HospitalAI</span>
              )}
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce [animation-delay:0ms]">●</span>
                <span className="animate-bounce [animation-delay:150ms]">●</span>
                <span className="animate-bounce [animation-delay:300ms]">●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="flex gap-2"
      >
        <input
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ask about wait times, hospitals, queues..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
