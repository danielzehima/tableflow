import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MentionsLegalesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Mentions légales
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Dernière mise à jour : mai 2026
          </p>

          <div className="space-y-8 text-slate-600 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Éditeur du site
              </h2>
              <p>
                TableFlow SAS — Société par Actions Simplifiée au capital de
                10 000 €.
                <br />
                Siège social : Abidjan, Côte d&apos;Ivoire.
                <br />
                Email :{" "}
                <a
                  href="mailto:contact@tableflow.io"
                  className="text-orange-500 hover:underline"
                >
                  contact@tableflow.io
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Hébergement
              </h2>
              <p>
                Ce site est hébergé par Vercel Inc., 340 Pine Street, Suite
                701, San Francisco, CA 94104, États-Unis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Propriété intellectuelle
              </h2>
              <p>
                L&apos;ensemble des contenus présents sur ce site (textes,
                images, logos, icônes) est protégé par le droit de la propriété
                intellectuelle. Toute reproduction sans autorisation est
                interdite.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Données personnelles
              </h2>
              <p>
                Les données collectées via les formulaires (nom, email) sont
                utilisées uniquement pour vous contacter ou gérer votre compte.
                Elles ne sont jamais revendues à des tiers. Conformément au
                RGPD, vous disposez d&apos;un droit d&apos;accès, de
                rectification et de suppression de vos données.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Cookies
              </h2>
              <p>
                Ce site utilise des cookies fonctionnels nécessaires à son bon
                fonctionnement. Aucun cookie publicitaire ou de tracking tiers
                n&apos;est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Contact
              </h2>
              <p>
                Pour toute question relative à ces mentions légales, contactez
                nous à{" "}
                <a
                  href="mailto:contact@tableflow.io"
                  className="text-orange-500 hover:underline"
                >
                  contact@tableflow.io
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
