import Link from "next/link";
import { supabase } from "../lib/supabase-server";

type Article = {
  id: string; title: string; slug: string; excerpt: string;
  category: string; cover_emoji: string; author: string;
  reading_time: number; created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Conseil": "bg-blue-100 text-blue-700",
  "Guide": "bg-emerald-100 text-emerald-700",
  "Nouveauté": "bg-orange-100 text-orange-700",
  "Article": "bg-slate-100 text-slate-700",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, category, cover_emoji, author, reading_time, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const list: Article[] = articles ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <span className="text-orange-500 font-semibold text-xs uppercase tracking-widest">Blog</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-3 mb-4">
            Ressources & Conseils
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto">
            Guides pratiques, nouveautés et bonnes pratiques pour les restaurateurs qui veulent grandir.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 mt-6 text-slate-400 hover:text-slate-600 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Articles */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {list.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">✍️</div>
            <p className="text-lg font-semibold text-slate-500">Aucun article publié pour le moment.</p>
            <p className="text-sm mt-2">Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="h-32 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                  {article.cover_emoji}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.category] ?? "bg-slate-100 text-slate-600"}`}>
                      {article.category}
                    </span>
                    <span className="text-slate-400 text-xs">{article.reading_time} min</span>
                  </div>
                  <h2 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{fmt(article.created_at)}</span>
                    <span className="text-orange-500 text-xs font-semibold group-hover:underline">Lire →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
