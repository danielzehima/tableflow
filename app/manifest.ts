import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "TableFlow — Dashboard",
    short_name: "TableFlow",
    description: "Gérez votre restaurant sans friction — commandes, cuisine, réservations, statistiques en temps réel.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#f97316",
    orientation: "portrait",
    lang: "fr",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Commandes", short_name: "Commandes", url: "/dashboard/commandes", description: "Voir les commandes en cours" },
      { name: "Cuisine", short_name: "Cuisine", url: "/dashboard/cuisine", description: "Affichage cuisine" },
      { name: "Réservations", short_name: "Réservations", url: "/dashboard/reservations", description: "Gérer les réservations" },
    ],
  };
}
