"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
  order_id: string | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-400" : "text-slate-200"}>★</span>
      ))}
    </div>
  );
}

export default function AvisPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { setLoading(false); return; }
      const me = await meRes.json();
      const rid = me.restaurant?.id ?? "";
      if (!rid) { setLoading(false); return; }
      setRestaurantId(rid);
      const res = await fetch(`/api/reviews?restaurant_id=${rid}&limit=100`);
      if (res.ok) setReviews(await res.json());
      setLoading(false);
    }
    init();
  }, []);

  const filtered = filter ? reviews.filter((r) => r.rating === filter) : reviews;
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-3xl">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-2xl h-24 border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Avis clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {reviews.length} avis reçu{reviews.length > 1 ? "s" : ""}
          </p>
        </div>
        {avg && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 text-center shrink-0">
            <div className="text-3xl font-extrabold text-yellow-500">★ {avg}</div>
            <div className="text-xs text-slate-500 mt-0.5">Note moyenne</div>
          </div>
        )}
      </div>

      {/* Filtre par étoiles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
            filter === null
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
          }`}
        >
          Tous
        </button>
        {[5, 4, 3, 2, 1].map((s) => {
          const count = reviews.filter((r) => r.rating === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? null : s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                filter === s
                  ? "bg-yellow-400 text-white border-yellow-400"
                  : "bg-white text-slate-600 border-slate-200 hover:border-yellow-300"
              }`}
            >
              {"★".repeat(s)} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des avis */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-sm font-medium">Aucun avis pour l&apos;instant</p>
          <p className="text-xs mt-1">Les avis apparaîtront après chaque commande</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Stars rating={review.rating} />
                    {review.customer_name && (
                      <span className="text-sm font-semibold text-slate-700">{review.customer_name}</span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                  )}
                  {!review.comment && (
                    <p className="text-slate-400 text-xs italic">Aucun commentaire</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {review.order_id && (
                    <div className="text-[10px] text-slate-300 mt-0.5">Commande liée</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
