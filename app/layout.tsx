import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TableFlow — Gérez votre restaurant sans friction",
  description:
    "La plateforme SaaS tout-en-un pour les restaurants. Menus, réservations, commandes et analytics en un seul endroit.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={geist.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TableFlow" />
        <meta name="application-name" content="TableFlow" />
      </head>
      <body className="antialiased">
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').then(function (reg) {
                // Vérifier les mises à jour du SW à chaque chargement
                reg.update();
                reg.addEventListener('updatefound', function () {
                  var nw = reg.installing;
                  if (!nw) return;
                  nw.addEventListener('statechange', function () {
                    // Nouveau SW prêt + un SW contrôle déjà la page => activer tout de suite
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                      nw.postMessage('SKIP_WAITING');
                    }
                  });
                });
              }).catch(function () {});
              // Recharger une seule fois quand le nouveau SW prend le contrôle
              var refreshing = false;
              navigator.serviceWorker.addEventListener('controllerchange', function () {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
              });
            });
          }`
        }} />
      </body>
    </html>
  );
}
