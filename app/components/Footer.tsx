const productLinks = [
  { label: "Fonctionnalités", href: "/#features" },
  { label: "Tarifs", href: "/#pricing" },
  { label: "Démo", href: "/#features" },
  { label: "Nouveautés", href: "/#features" },
];
const companyLinks = [
  { label: "À propos", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
const legalLinks = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGU", href: "/cgu" },
  { label: "Politique de confidentialité", href: "/politique-confidentialite" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded-xl p-1.5 inline-flex">
                <img src="/logo.png" alt="TableFlow" className="h-10 w-auto" />
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm text-sm">
              La plateforme SaaS tout-en-un pour les restaurants. Gérez votre
              activité, développez votre clientèle.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Produit</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Entreprise</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Légal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-xs md:text-sm">© 2026 TableFlow. Tous droits réservés.</p>
          <p className="text-xs md:text-sm">Fait avec ❤️ pour les restaurateurs</p>
        </div>
      </div>
    </footer>
  );
}
