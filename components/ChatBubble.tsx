"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat pesan baru muncul
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Generate threadId saat pertama kali load
  useEffect(() => {
    const savedThreadId = localStorage.getItem("chat_thread_id");
    if (savedThreadId) {
      setThreadId(savedThreadId);
    } else {
      const newThreadId = "user_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("chat_thread_id", newThreadId);
      setThreadId(newThreadId);
    }

    // Initialize first message from Heracles
    setMessages([
      {
        id: "msg_1",
        role: "assistant",
        content: "Halo! Saya Heracles, asisten konsultan suplemen Anda. Ada yang bisa saya bantu hari ini?",
      },
    ]);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Tambahkan pesan user ke UI
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userMessage },
    ]);
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: threadId,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengambil respon dari server.");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Mohon maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi beberapa saat.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Jendela Chat */}
      {isOpen && (
        <div className="mb-4 w-[350px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Heracles
              </h3>
              <p className="text-xs text-blue-100 font-medium">Konsultan Suplemen Ambrosia</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Area Pesan */}
          <div className="flex-1 p-4 h-[400px] max-h-[60vh] overflow-y-auto flex flex-col gap-3 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm self-end shadow-sm"
                    : "bg-white text-gray-800 rounded-tl-sm self-start shadow-sm border border-gray-100"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            
            {/* Animasi Loading */}
            {isLoading && (
              <div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm self-start p-4 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang suplemen..."
                className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-800 placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tombol Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        } absolute bottom-0 right-0 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out`}
        aria-label="Tanya Heracles"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
}
