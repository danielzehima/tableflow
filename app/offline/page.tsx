export const dynamic = "force-static";

export const metadata = {
  title: "Hors ligne — TableFlow",
  description: "Connexion internet indisponible",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656M3 3l18 18" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Vous êtes hors ligne</h1>
        <p className="text-slate-600 text-sm mb-6">
          La connexion internet est indisponible. Vérifiez votre réseau puis réessayez.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Réessayer
        </a>
      </div>
    </main>
  );
}
