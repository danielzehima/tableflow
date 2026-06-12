"use client";

import { useEffect, useState } from "react";

export default function OfflineReconnect() {
  const [checking, setChecking] = useState(false);

  // Recharge automatiquement quand la connexion revient
  useEffect(() => {
    function handleOnline() {
      window.location.reload();
    }
    window.addEventListener("online", handleOnline);

    // Sonde réseau périodique (l'événement "online" peut manquer sur certains mobiles)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store" })
          .then(() => window.location.reload())
          .catch(() => {});
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  function retry() {
    setChecking(true);
    window.location.reload();
  }

  return (
    <button
      onClick={retry}
      disabled={checking}
      className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
    >
      {checking ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Reconnexion…
        </>
      ) : (
        "Réessayer"
      )}
    </button>
  );
}
