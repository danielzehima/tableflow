import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Mentions légales — TableFlow",
  description: "Mentions légales de TableFlow, édité par DigitAgence.",
};

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
                Le site TableFlow est édité par <strong>DigitAgence</strong>.
                <br />
                Adresse : Abidjan, Yopougon Sideci Akadjoba, Côte d&apos;Ivoire.
                <br />
                Téléphone :{" "}
                <a href="tel:+2250710075257" className="text-orange-500 hover:underline">
                  +225 07 10 07 52 57
                </a>
                <br />
                Email :{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Directeur de la publication
              </h2>
              <p>
                Le directeur de la publication est le représentant légal de
                DigitAgence.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Hébergement
              </h2>
              <p>
                Ce site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine
                Street, Suite 701, San Francisco, CA 94104, États-Unis.
                <br />
                Les données applicatives sont stockées via <strong>Supabase</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Propriété intellectuelle
              </h2>
              <p>
                L&apos;ensemble des contenus présents sur ce site (textes,
                images, logos, icônes, code source) est la propriété exclusive
                de DigitAgence ou de ses partenaires, et est protégé par le
                droit de la propriété intellectuelle. Toute reproduction,
                représentation ou diffusion, totale ou partielle, sans
                autorisation écrite préalable, est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Responsabilité
              </h2>
              <p>
                DigitAgence s&apos;efforce d&apos;assurer l&apos;exactitude et
                la mise à jour des informations diffusées sur ce site, mais ne
                peut garantir l&apos;absence d&apos;erreurs ou d&apos;omissions.
                L&apos;utilisation du service TableFlow se fait sous la seule
                responsabilité de l&apos;utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Contact
              </h2>
              <p>
                Pour toute question, contactez-nous à{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>{" "}
                ou au +225 07 10 07 52 57.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
