export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-slate-900">
            Table<span className="text-orange-500">Flow</span>
          </span>
        </div>

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
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#"
            className="text-slate-600 hover:text-slate-900 text-sm font-medium hidden md:block"
          >
            Connexion
          </a>
          <a
            href="#"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Essai gratuit
          </a>
        </div>
      </div>
    </nav>
  );
}
