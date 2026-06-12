"use client";

import { useEffect, useState } from "react";

type Article = {
  id: string; title: string; slug: string; excerpt: string;
  content: string; category: string; cover_emoji: string;
  author: string; reading_time: number; published: boolean;
  created_at: string; updated_at: string;
};

const EMPTY: Omit<Article, "id" | "created_at" | "updated_at"> = {
  title: "", slug: "", excerpt: "", content: "",
  category: "Article", cover_emoji: "📝", author: "Équipe TableFlow",
  reading_time: 5, published: false,
};

const CATEGORIES = ["Article", "Conseil", "Guide", "Nouveauté", "Tutoriel"];
const EMOJIS = ["📝", "📈", "🍽️", "🔔", "💡", "🚀", "📊", "🎯", "✨", "🌟"];

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperadminBlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/superadmin/blog");
    if (res.ok) setArticles(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(a: Article) {
    setEditing(a);
    setForm({ title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content, category: a.category, cover_emoji: a.cover_emoji, author: a.author, reading_time: a.reading_time, published: a.published });
    setError("");
    setShowForm(true);
  }

  async function revalidateBlog(slug?: string) {
    await fetch("/api/revalidate/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editing ? `/api/superadmin/blog/${editing.id}` : "/api/superadmin/blog";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const saved = await res.json();
      setShowForm(false);
      if (saved.published) await revalidateBlog(saved.slug);
      await load();
    } else {
      const d = await res.json(); setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  async function togglePublish(a: Article) {
    setActingId(a.id);
    await fetch(`/api/superadmin/blog/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    await revalidateBlog(a.slug);
    await load();
    setActingId(null);
  }

  async function remove(a: Article) {
    if (!confirm(`Supprimer « ${a.title} » ?`)) return;
    setActingId(a.id);
    await fetch(`/api/superadmin/blog/${a.id}`, { method: "DELETE" });
    await revalidateBlog(a.slug);
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
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="text-slate-400 text-sm mt-0.5">{articles.length} article(s) · {articles.filter(a => a.published).length} publié(s)</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel article
        </button>
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {articles.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <div className="text-4xl mb-3">✍️</div>
            <p className="text-sm">Aucun article. Créez le premier !</p>
          </div>
        ) : (
          articles.map((a, i) => (
            <div key={a.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors ${i < articles.length - 1 ? "border-b border-slate-800" : ""}`}>
              <div className="text-2xl shrink-0">{a.cover_emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm truncate">{a.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${a.published ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-slate-700/60 text-slate-400 border border-slate-600"}`}>
                    {a.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{a.category} · {a.reading_time} min · {fmt(a.created_at)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(a)} disabled={actingId === a.id}
                  title={a.published ? "Dépublier" : "Publier"}
                  className={`p-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 ${a.published ? "text-slate-400 hover:bg-amber-500/10 hover:text-amber-400" : "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"}`}>
                  {a.published ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <button onClick={() => openEdit(a)} disabled={actingId === a.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => remove(a)} disabled={actingId === a.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">{editing ? "Modifier l'article" : "Nouvel article"}</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

              <form onSubmit={save} className="space-y-4">
                {/* Emoji + category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Emoji de couverture</label>
                    <select value={form.cover_emoji} onChange={e => setForm({ ...form, cover_emoji: e.target.value })} className={inputCls}>
                      {EMOJIS.map(e => <option key={e} value={e}>{e} {e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Catégorie</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className={labelCls}>Titre</label>
                  <input required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
                    className={inputCls} placeholder="Titre de l'article" />
                </div>

                {/* Slug */}
                <div>
                  <label className={labelCls}>Slug (URL)</label>
                  <input required value={form.slug}
                    onChange={e => setForm({ ...form, slug: slugify(e.target.value) })}
                    className={inputCls} placeholder="slug-de-l-article" />
                </div>

                {/* Excerpt */}
                <div>
                  <label className={labelCls}>Résumé (extrait)</label>
                  <textarea required value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                    rows={2} className={`${inputCls} resize-none`} placeholder="Courte description affichée dans la liste..." />
                </div>

                {/* Content */}
                <div>
                  <label className={labelCls}>Contenu <span className="normal-case text-slate-500">(## pour sous-titre, ligne vide entre paragraphes)</span></label>
                  <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    rows={14} className={`${inputCls} resize-y font-mono text-xs`} placeholder="Écrivez votre article ici..." />
                </div>

                {/* Author + reading time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Auteur</label>
                    <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Temps de lecture (min)</label>
                    <input type="number" min={1} max={60} value={form.reading_time}
                      onChange={e => setForm({ ...form, reading_time: parseInt(e.target.value) || 5 })} className={inputCls} />
                  </div>
                </div>

                {/* Published toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                  <button type="button" onClick={() => setForm({ ...form, published: !form.published })}
                    className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${form.published ? "bg-emerald-500" : "bg-slate-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-slate-300">Publier immédiatement</span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {saving ? "Sauvegarde…" : editing ? "Enregistrer" : "Créer l'article"}
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

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500";
const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide";
