import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Conditions Générales d'Utilisation — TableFlow",
  description:
    "Conditions Générales d'Utilisation de la plateforme TableFlow, éditée par DigitAgence.",
};

export default function CGUPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Dernière mise à jour : mai 2026
          </p>

          <div className="space-y-8 text-slate-600 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Objet
              </h2>
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (CGU) ont
                pour objet de définir les modalités et conditions
                d&apos;utilisation de la plateforme <strong>TableFlow</strong>,
                éditée par <strong>DigitAgence</strong>, dont le siège est
                situé à Abidjan, Yopougon Sideci Akadjoba, Côte d&apos;Ivoire.
                Tout accès et toute utilisation du service impliquent
                l&apos;acceptation pleine et entière des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Définitions
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Plateforme</strong> : le service SaaS TableFlow
                  accessible en ligne.
                </li>
                <li>
                  <strong>Utilisateur</strong> : tout professionnel
                  (restaurateur) ou client final utilisant la plateforme.
                </li>
                <li>
                  <strong>Compte</strong> : espace personnel créé par
                  l&apos;Utilisateur après inscription.
                </li>
                <li>
                  <strong>Abonnement</strong> : formule payante donnant accès
                  aux fonctionnalités de TableFlow (Gratuit, Starter, Pro).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Inscription et compte
              </h2>
              <p>
                L&apos;accès aux fonctionnalités professionnelles nécessite la
                création d&apos;un compte. L&apos;Utilisateur s&apos;engage à
                fournir des informations exactes et à les maintenir à jour. Il
                est seul responsable de la confidentialité de ses identifiants
                et de toutes les activités effectuées depuis son compte.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Description du service
              </h2>
              <p>
                TableFlow propose une suite d&apos;outils digitaux destinés aux
                restaurants : page publique vitrine, menu en ligne, gestion des
                réservations, prise de commandes, paiement en ligne,
                statistiques, programme de fidélité et autres modules selon le
                plan souscrit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Abonnement et paiement
              </h2>
              <p>
                Les tarifs en vigueur sont indiqués sur la page Tarifs du site.
                L&apos;abonnement est conclu pour une durée mensuelle,
                renouvelable par tacite reconduction. Les paiements sont
                effectués via les prestataires sécurisés intégrés (CinetPay,
                GeniusPay). Tout mois entamé est dû.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Obligations de l&apos;Utilisateur
              </h2>
              <p>
                L&apos;Utilisateur s&apos;engage à utiliser la plateforme dans
                le respect des lois et règlements en vigueur. Sont notamment
                interdits : la publication de contenus illicites, la fraude,
                l&apos;atteinte aux droits de tiers, l&apos;envoi de
                pourriels, ou toute tentative de compromission de la sécurité
                du service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Suspension et résiliation
              </h2>
              <p>
                DigitAgence se réserve le droit de suspendre ou supprimer tout
                compte en cas de manquement aux présentes CGU, sans préavis ni
                indemnité. L&apos;Utilisateur peut résilier son abonnement à
                tout moment depuis son tableau de bord ; la résiliation prend
                effet à la fin de la période en cours.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                8. Responsabilité
              </h2>
              <p>
                DigitAgence met en œuvre les moyens nécessaires pour assurer
                la disponibilité et la sécurité de la plateforme. Elle ne
                saurait toutefois être tenue responsable des dommages indirects
                résultant de l&apos;utilisation du service, ni des
                interruptions liées à des causes extérieures (hébergeur,
                opérateur, force majeure).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                9. Propriété intellectuelle
              </h2>
              <p>
                La plateforme, son code, ses contenus et sa marque demeurent la
                propriété exclusive de DigitAgence. Aucune licence
                d&apos;utilisation autre que celle nécessaire à
                l&apos;utilisation normale du service n&apos;est accordée.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                10. Données personnelles
              </h2>
              <p>
                Le traitement des données personnelles est décrit dans notre{" "}
                <a
                  href="/politique-confidentialite"
                  className="text-orange-500 hover:underline"
                >
                  Politique de Confidentialité
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                11. Modification des CGU
              </h2>
              <p>
                DigitAgence se réserve le droit de modifier les présentes CGU
                à tout moment. Les Utilisateurs seront informés de toute
                modification substantielle par email ou via la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                12. Droit applicable
              </h2>
              <p>
                Les présentes CGU sont régies par le droit ivoirien. Tout
                litige relatif à leur exécution ou interprétation relève de la
                compétence exclusive des tribunaux d&apos;Abidjan, sauf
                disposition légale contraire.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                13. Contact
              </h2>
              <p>
                Pour toute question relative aux présentes CGU :{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>{" "}
                — +225 07 10 07 52 57.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
