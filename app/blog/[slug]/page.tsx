import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase-server";

type Article = {
  id: string; title: string; slug: string; excerpt: string;
  content: string; category: string; cover_emoji: string;
  author: string; reading_time: number; created_at: string;
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

function renderContent(content: string) {
  return content.split("\n\n").map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("## ")) {
      return <h2 key={i} className="text-xl md:text-2xl font-bold text-slate-900 mt-8 mb-3">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith("# ")) {
      return <h1 key={i} className="text-2xl md:text-3xl font-bold text-slate-900 mt-8 mb-3">{trimmed.slice(2)}</h1>;
    }
    return (
      <p key={i} className="text-slate-600 leading-relaxed mb-4">
        {trimmed.split("\n").map((line, j) => (
          <span key={j}>{line}{j < trimmed.split("\n").length - 1 && <br />}</span>
        ))}
      </p>
    );
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) notFound();
  const article = data as Article;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-12">
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.category] ?? "bg-slate-100 text-slate-600"}`}>
              {article.category}
            </span>
            <span className="text-slate-400 text-xs">{article.reading_time} min de lecture</span>
          </div>

          <div className="text-6xl mb-6">{article.cover_emoji}</div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-6">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {article.author.charAt(0)}
            </div>
            <div>
              <div className="text-slate-700 text-sm font-semibold">{article.author}</div>
              <div className="text-slate-400 text-xs">{fmt(article.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <article className="prose-slate">
          {renderContent(article.content)}
        </article>

        {/* CTA */}
        <div className="mt-12 bg-orange-50 border border-orange-200 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-slate-700 font-semibold text-base mb-2">Prêt à digitaliser votre restaurant ?</p>
          <p className="text-slate-500 text-sm mb-5">Essayez TableFlow gratuitement pendant 14 jours.</p>
          <Link href="/inscription"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            Commencer gratuitement
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/blog" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
            ← Voir tous les articles
          </Link>
        </div>
      </main>
    </div>
  );
}
