export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src="/logo.png" alt="TableFlow" className="h-11 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            Fonctionnalités
          </a>
          <a
            href="#pricing"
            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            Tarifs
          </a>
          <a
            href="/demo"
            className="text-orange-500 hover:text-orange-600 transition-colors text-sm font-semibold"
          >
            Démo →
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            Connexion
          </a>
          <a
            href="/inscription"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Essai gratuit
          </a>
        </div>
      </div>
    </nav>
  );
}
