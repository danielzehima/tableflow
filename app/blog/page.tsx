import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const articles = [
  {
    category: "Conseil",
    title: "5 façons d'augmenter vos réservations en ligne",
    excerpt:
      "Découvrez comment optimiser votre page publique TableFlow pour attirer plus de clients et réduire les no-shows.",
    date: "12 mai 2026",
    readTime: "4 min",
    emoji: "📈",
  },
  {
    category: "Fonctionnalité",
    title: "Nouveau : notifications SMS en temps réel",
    excerpt:
      "Vos clients reçoivent désormais une confirmation par SMS dès qu'une réservation est acceptée ou modifiée.",
    date: "5 mai 2026",
    readTime: "2 min",
    emoji: "💬",
  },
  {
    category: "Guide",
    title: "Créer un menu digital qui donne envie",
    excerpt:
      "Photos, descriptions courtes, mise en avant des plats du jour — les bonnes pratiques pour un menu qui convertit.",
    date: "28 avr. 2026",
    readTime: "6 min",
    emoji: "📋",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-orange-500 font-semibold text-xs uppercase tracking-widest">
              Blog
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-2">
              Ressources pour restaurateurs
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Conseils, nouveautés et guides pour développer votre activité.
            </p>
          </div>

          <div className="space-y-5">
            {articles.map((article) => (
              <a
                key={article.title}
                href="#"
                className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm hover:border-orange-200 hover:shadow-md transition-all"
              >
                <div className="text-3xl shrink-0">{article.emoji}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      · {article.date} · {article.readTime} de lecture
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 mb-1 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
