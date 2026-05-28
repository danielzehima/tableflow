"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  sender: "visitor" | "staff";
  staff_name: string | null;
  content: string;
  created_at: string;
}

const SESSION_KEY = "tf_chat_session";

export default function ChatWidget({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [nameAsked, setNameAsked] = useState(false);
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; });

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return;
      const { id, name } = JSON.parse(stored) as { id: string; name: string };
      setSessionId(id);
      setVisitorName(name);
      setNameAsked(true);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages — stable, only restarts when sessionId/closed changes
  useEffect(() => {
    if (!sessionId || closed) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        if (!res.ok) return;
        const { messages: incoming, status } = await res.json() as {
          messages: Message[];
          status: string;
        };
        // If staff closed the session, update UI and clear stored session
        if (status === "closed") {
          setClosed(true);
          localStorage.removeItem(SESSION_KEY);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
        setMessages((prev) => {
          // Never reduce message count — protects against race condition on first send
          if (incoming.length < prev.length) return prev;
          if (incoming.length > prev.length && !openRef.current) setHasUnread(true);
          return incoming;
        });
      } catch {
        // network error — ignore
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, closed]);

  // Clear unread badge when chat is opened
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  async function startSession() {
    const name = visitorName.trim() || "Visiteur";
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, visitorName: name }),
    });
    if (!res.ok) return;
    const data = await res.json();
    // Persist session so messages survive page reloads
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: data.sessionId, name }));
    setSessionId(data.sessionId);
    setNameAsked(true);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending || closed) return;
    const content = input.trim();

    // Optimistic update — message visible immediately, no waiting for server
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: "visitor",
      staff_name: null,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    setSending(true);

    const postRes = await fetch(`/api/chat/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (postRes.ok) {
      // Confirm from server (small delay to ensure DB write is visible)
      await new Promise((r) => setTimeout(r, 200));
      const getRes = await fetch(`/api/chat/${sessionId}`);
      if (getRes.ok) {
        const { messages: confirmed } = await getRes.json() as { messages: Message[]; status: string };
        setMessages((prev) => confirmed.length >= prev.length ? confirmed : prev);
      }
    }

    setSending(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 420 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-semibold text-sm">Chat en direct</span>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Name prompt */}
          {!nameAsked ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-slate-300 text-sm text-center">
                Bonjour ! Comment puis-je vous appeler ?
              </p>
              <input
                autoFocus
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startSession()}
                placeholder="Votre prénom..."
                className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60"
              />
              <button onClick={startSession}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Démarrer la conversation
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && !closed && (
                  <p className="text-slate-500 text-xs text-center pt-4">
                    Envoyez votre premier message, l&apos;équipe vous répond rapidement !
                  </p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id}
                    className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      msg.sender === "visitor"
                        ? msg.id.startsWith("temp-")
                          ? "bg-orange-400/80 text-white"
                          : "bg-orange-500 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}>
                      {msg.sender === "staff" && msg.staff_name && (
                        <p className="text-xs text-slate-400 mb-0.5 font-medium">{msg.staff_name}</p>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
                {closed && (
                  <p className="text-slate-500 text-xs text-center py-2">
                    Conversation terminée. Actualisez la page pour recommencer.
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {!closed && (
                <form onSubmit={sendMessage}
                  className="flex gap-2 px-3 py-3 border-t border-slate-700">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Votre message..."
                    className="flex-1 bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60"
                  />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl px-3 py-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        className="relative w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all hover:scale-105">
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">!</span>
        )}
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
