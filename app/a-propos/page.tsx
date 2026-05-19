import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const values = [
  {
    emoji: "🎯",
    title: "Simplicité avant tout",
    desc: "Chaque fonctionnalité doit être utilisable sans formation. Nos restaurateurs ont autre chose à faire.",
  },
  {
    emoji: "🤝",
    title: "Proximité client",
    desc: "Nous répondons à chaque message. Votre retour façonne directement les prochaines mises à jour.",
  },
  {
    emoji: "🌍",
    title: "Conçu pour l'Afrique",
    desc: "TableFlow est pensé pour les réalités locales : connectivité variable, paiements mobiles, clientèle de proximité.",
  },
];

export default function AProposPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-slate-900 text-white py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              Notre mission : simplifier la gestion{" "}
              <span className="text-orange-400">des restaurants</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              TableFlow est né d&apos;un constat simple : les restaurateurs
              passent trop de temps sur des tâches administratives et pas assez
              avec leurs clients.
            </p>
          </div>
        </section>

        {/* Histoire */}
        <section className="py-14 md:py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-5">
              Notre histoire
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4 text-sm md:text-base">
              <p>
                Fondée en 2024, TableFlow a démarré avec une idée simple :
                donner aux restaurateurs les mêmes outils digitaux que les
                grandes chaînes, à un prix accessible.
              </p>
              <p>
                Aujourd&apos;hui, plus de 2 000 établissements utilisent
                TableFlow chaque jour pour gérer leurs menus, leurs
                réservations, leurs commandes et analyser leurs performances.
              </p>
              <p>
                Notre équipe est composée de passionnés de restauration et de
                technologie, convaincus que le digital peut transformer
                l&apos;expérience culinaire locale.
              </p>
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="py-14 md:py-20 px-4 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 text-center">
              Nos valeurs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm"
                >
                  <div className="text-4xl mb-3">{v.emoji}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Rejoignez l&apos;aventure
            </h2>
            <p className="text-slate-500 mb-6 text-sm md:text-base">
              14 jours d&apos;essai gratuit, sans carte bancaire.
            </p>
            <a
              href="/inscription"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Commencer maintenant →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
