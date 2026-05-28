"use client";

import { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  sender: "visitor" | "staff";
  staff_name: string | null;
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  visitor_name: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  chat_messages: ChatMessage[];
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function MessagesPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [closed, setClosed] = useState<ChatSession[]>([]);
  const [selected, setSelected] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchChats(status: "open" | "closed") {
    const res = await fetch(`/api/dashboard/chats?status=${status}`);
    if (!res.ok) return;
    const data = await res.json();
    if (status === "open") setChats(data.chats);
    else setClosed(data.chats);
  }

  useEffect(() => {
    fetchChats("open");
    fetchChats("closed");
    const iv = setInterval(() => fetchChats("open"), 5000);
    return () => clearInterval(iv);
  }, []);

  // Poll selected session messages
  useEffect(() => {
    if (!selected) return;
    const poll = async () => {
      const res = await fetch(`/api/chat/${selected.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectChat(chat: ChatSession) {
    setSelected(chat);
    setMessages(chat.chat_messages ?? []);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    await fetch(`/api/dashboard/chats/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    setInput("");
    const res = await fetch(`/api/chat/${selected.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
    setSending(false);
  }

  async function closeSession() {
    if (!selected) return;
    await fetch(`/api/dashboard/chats/${selected.id}`, { method: "PATCH" });
    setSelected(null);
    setMessages([]);
    fetchChats("open");
    fetchChats("closed");
  }

  const displayList = tab === "open" ? chats : closed;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar — liste des conversations */}
      <div className="w-72 border-r border-slate-800 flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-white font-bold text-lg">Messages</h1>
          <div className="flex gap-1 mt-3">
            {(["open", "closed"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                  tab === t ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}>
                {t === "open" ? `En cours (${chats.length})` : `Fermés (${closed.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 && (
            <p className="text-slate-500 text-sm text-center mt-8 px-4">
              {tab === "open" ? "Aucune conversation en cours" : "Aucune conversation fermée"}
            </p>
          )}
          {displayList.map((chat) => {
            const last = chat.chat_messages?.slice(-1)[0];
            return (
              <button key={chat.id} onClick={() => selectChat(chat)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
                  selected?.id === chat.id ? "bg-slate-800 border-l-2 border-l-orange-500" : ""
                }`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-white font-semibold text-sm truncate">{chat.visitor_name}</span>
                  <span className="text-slate-500 text-xs shrink-0">{timeAgo(chat.updated_at)}</span>
                </div>
                {last && (
                  <p className="text-slate-500 text-xs truncate">
                    {last.sender === "staff" ? "Vous : " : ""}{last.content}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone de conversation */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-slate-950">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h2 className="text-white font-bold">{selected.visitor_name}</h2>
              <p className="text-slate-500 text-xs">
                Démarré {timeAgo(selected.created_at)}
                {selected.status === "closed" && (
                  <span className="ml-2 text-red-400">• Fermé</span>
                )}
              </p>
            </div>
            {selected.status === "open" && (
              <button onClick={closeSession}
                className="text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors">
                Fermer la conversation
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-slate-600 text-sm text-center mt-8">Aucun message</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id}
                className={`flex ${msg.sender === "staff" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[60%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === "staff"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}>
                  {msg.sender === "visitor" && (
                    <p className="text-xs text-slate-400 mb-0.5 font-medium">{selected.visitor_name}</p>
                  )}
                  {msg.sender === "staff" && msg.staff_name && (
                    <p className="text-xs text-orange-200 mb-0.5 font-medium">{msg.staff_name}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "staff" ? "text-orange-200" : "text-slate-500"}`}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {selected.status === "open" && (
            <form onSubmit={sendMessage}
              className="flex gap-3 px-6 py-4 border-t border-slate-800">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Répondre à ${selected.visitor_name}…`}
                className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60"
              />
              <button type="submit" disabled={sending || !input.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm">
                Envoyer
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
