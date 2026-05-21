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
  appleWebApp: {
    capable: true,
    title: "TableFlow",
    statusBarStyle: "black-translucent",
  },
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
