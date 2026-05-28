"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS, ROLE_COLORS } from "../../lib/auth";
import type { Role } from "../../lib/auth";

type Member = {
  id: string; name: string; email: string;
  role: Role; active: boolean; created_at: string;
};

const ROLES_SELECTABLE: { value: Role; label: string; desc: string }[] = [
  { value: "manager", label: "Gérant",     desc: "Menu, réservations, commandes, stats" },
  { value: "waiter",  label: "Serveur",    desc: "Réservations et commandes uniquement" },
  { value: "cashier", label: "Cuisinier",  desc: "Commandes + vue cuisine" },
];

export default function EquipePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "waiter" as Role });
  const [showPwd, setShowPwd] = useState(false);

  async function load() {
    const res = await fetch("/api/auth/team");
    if (res.status === 403) { setIsOwner(false); setLoading(false); return; }
    if (res.ok) {
      const data: Member[] = await res.json();
      setMembers(data);
      // If we can fetch the list, check if current user is owner from the data
      setIsOwner(true);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/auth/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "waiter" });
      setShowForm(false);
      await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  async function toggleActive(member: Member) {
    setActingId(member.id);
    await fetch(`/api/auth/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    await load();
    setActingId(null);
  }

  async function changeRole(member: Member, role: Role) {
    setActingId(member.id);
    await fetch(`/api/auth/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
    setActingId(null);
  }

  async function removeMember(member: Member) {
    if (!confirm(`Supprimer ${member.name} de l'équipe ?`)) return;
    setActingId(member.id);
    await fetch(`/api/auth/team/${member.id}`, { method: "DELETE" });
    await load();
    setActingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Équipe</h1>
          <p className="text-green-700 text-sm mt-0.5">{members.length} membre(s) dans votre restaurant</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un membre
          </button>
        )}
      </div>

      {/* Roles legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["owner", "manager", "waiter", "cashier"] as Role[]).map((r) => (
          <div key={r} className="bg-white border border-slate-100 rounded-xl p-3">
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mb-1.5 ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
            <div className="text-green-700 text-xs leading-relaxed">
              {r === "owner"   && "Accès complet + gestion équipe"}
              {r === "manager" && "Menu, réservations, commandes, stats"}
              {r === "waiter"  && "Réservations + commandes"}
              {r === "cashier" && "Commandes + vue cuisine"}
            </div>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {members.length === 0 ? (
          <div className="py-16 text-center text-green-700">
            <svg className="w-10 h-10 mx-auto mb-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Aucun membre dans l&apos;équipe</p>
          </div>
        ) : (
          members.map((m, i) => (
            <div key={m.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < members.length - 1 ? "border-b border-slate-100" : ""}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                ${m.active ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-green-700"}`}>
                {m.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${m.active ? "text-slate-900" : "text-green-700 line-through"}`}>
                    {m.name}
                  </span>
                  {!m.active && <span className="text-xs text-green-700">(désactivé)</span>}
                </div>
                <div className="text-green-700 text-xs truncate">{m.email}</div>
              </div>

              {/* Role badge / select */}
              {m.role === "owner" ? (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[m.role]}`}>
                  {ROLE_LABELS[m.role]}
                </span>
              ) : isOwner ? (
                <select value={m.role} disabled={actingId === m.id}
                  onChange={(e) => changeRole(m, e.target.value as Role)}
                  className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${ROLE_COLORS[m.role]} bg-transparent`}>
                  {ROLES_SELECTABLE.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[m.role]}`}>
                  {ROLE_LABELS[m.role]}
                </span>
              )}

              {/* Actions (owner only, not on self) */}
              {isOwner && m.role !== "owner" && (
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(m)} disabled={actingId === m.id}
                    title={m.active ? "Désactiver" : "Activer"}
                    className={`p-1.5 rounded-lg text-xs transition-colors disabled:opacity-50
                      ${m.active ? "text-green-700 hover:bg-amber-50 hover:text-amber-500" : "text-green-700 hover:bg-emerald-50 hover:text-emerald-500"}`}>
                    {m.active ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => removeMember(m)} disabled={actingId === m.id}
                    className="p-1.5 rounded-lg text-green-700 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add member modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Ajouter un collaborateur</h2>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <form onSubmit={addMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nom complet</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Ex : Marie Koné" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="marie@restaurant.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mot de passe provisoire</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Minimum 8 caractères" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 hover:text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={showPwd ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Rôle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES_SELECTABLE.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.role === r.value
                            ? "border-orange-500 bg-orange-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}>
                        <div className="font-semibold text-xs text-slate-800">{r.label}</div>
                        <div className="text-green-700 text-[10px] mt-0.5 leading-relaxed">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {saving ? "Ajout…" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
