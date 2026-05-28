import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Politique de Confidentialité — TableFlow",
  description:
    "Politique de confidentialité de TableFlow : collecte, traitement et protection de vos données personnelles.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Dernière mise à jour : mai 2026
          </p>

          <div className="space-y-8 text-slate-600 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Responsable du traitement
              </h2>
              <p>
                Le responsable du traitement des données personnelles collectées
                sur TableFlow est <strong>DigitAgence</strong>, sis à Abidjan,
                Yopougon Sideci Akadjoba, Côte d&apos;Ivoire.
                <br />
                Contact :{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>{" "}
                — +225 07 10 07 52 57.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Données collectées
              </h2>
              <p>Nous collectons les catégories de données suivantes :</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>
                  <strong>Compte restaurateur</strong> : nom, prénom, email,
                  numéro de téléphone, nom du restaurant, adresse.
                </li>
                <li>
                  <strong>Compte client final</strong> : nom, email, téléphone
                  (lors d&apos;une réservation, commande ou inscription au
                  programme de fidélité).
                </li>
                <li>
                  <strong>Données de paiement</strong> : traitées directement
                  par nos prestataires (CinetPay, GeniusPay). Nous ne stockons
                  pas les numéros de carte.
                </li>
                <li>
                  <strong>Données techniques</strong> : logs de connexion,
                  adresse IP, type de navigateur, à des fins de sécurité.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Finalités du traitement
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Création et gestion des comptes utilisateurs.</li>
                <li>Fourniture du service (réservations, commandes, fidélité).</li>
                <li>Facturation et suivi des abonnements.</li>
                <li>Communication relative au service (emails transactionnels).</li>
                <li>Amélioration et sécurisation de la plateforme.</li>
                <li>Respect des obligations légales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Base légale
              </h2>
              <p>
                Les traitements reposent sur : l&apos;exécution du contrat
                (fourniture du service), votre consentement (notifications,
                marketing), nos intérêts légitimes (sécurité, amélioration) et
                le respect d&apos;obligations légales.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Destinataires des données
              </h2>
              <p>
                Vos données sont destinées à DigitAgence et à ses sous-traitants
                techniques strictement nécessaires :
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Supabase</strong> — hébergement de la base de données.</li>
                <li><strong>Vercel</strong> — hébergement de l&apos;application.</li>
                <li><strong>CinetPay / GeniusPay</strong> — traitement des paiements.</li>
              </ul>
              <p className="mt-2">
                Vos données ne sont jamais revendues ni cédées à des tiers à des
                fins commerciales.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Durée de conservation
              </h2>
              <p>
                Les données de compte sont conservées tant que le compte est
                actif, puis archivées jusqu&apos;à 3 ans après sa fermeture pour
                respecter nos obligations comptables et légales. Les données de
                facturation sont conservées 10 ans.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Sécurité
              </h2>
              <p>
                DigitAgence met en œuvre des mesures techniques et
                organisationnelles appropriées pour protéger vos données :
                chiffrement des communications (HTTPS), authentification
                sécurisée, contrôles d&apos;accès, sauvegardes régulières.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                8. Vos droits
              </h2>
              <p>
                Conformément à la réglementation applicable (RGPD et loi
                ivoirienne n° 2013-450 sur la protection des données à caractère
                personnel), vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Droit d&apos;accès à vos données.</li>
                <li>Droit de rectification.</li>
                <li>Droit à l&apos;effacement (« droit à l&apos;oubli »).</li>
                <li>Droit à la limitation du traitement.</li>
                <li>Droit à la portabilité.</li>
                <li>Droit d&apos;opposition.</li>
                <li>Droit de retirer votre consentement à tout moment.</li>
              </ul>
              <p className="mt-2">
                Pour exercer ces droits, écrivez à{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>
                . Une réponse vous sera apportée dans un délai maximum de 30
                jours.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                9. Cookies
              </h2>
              <p>
                TableFlow utilise uniquement des cookies fonctionnels
                nécessaires au bon fonctionnement du service (session,
                préférences). Aucun cookie publicitaire ou de tracking tiers
                n&apos;est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                10. Transferts hors UE
              </h2>
              <p>
                Certains sous-traitants (Vercel, Supabase) peuvent être situés
                en dehors de l&apos;Union européenne. Ces transferts sont
                encadrés par des garanties contractuelles standards conformes à
                la réglementation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                11. Modifications
              </h2>
              <p>
                La présente politique peut être mise à jour. Toute modification
                substantielle vous sera notifiée par email ou via la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                12. Contact
              </h2>
              <p>
                Pour toute question relative à vos données personnelles :{" "}
                <a
                  href="mailto:horebentreprise@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  horebentreprise@gmail.com
                </a>{" "}
                — +225 07 10 07 52 57 — Abidjan, Yopougon Sideci Akadjoba.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
