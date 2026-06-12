"use client";

import { useState, useContext, createContext, useEffect, useRef } from "react";
import ChatWidget from "./components/ChatWidget";
import { translations, detectLang } from "./i18n";
import type { Lang, T } from "./i18n";

const PrimaryColorCtx = createContext("#f97316");
const LangCtx = createContext<Lang>("fr");
const DynTranslCtx = createContext<(text: string) => string>((t) => t);
const OffPeakDiscountCtx = createContext<number>(0);

function useT(): T {
  return translations[useContext(LangCtx)] as T;
}
function useDynTr(): (text: string) => string {
  return useContext(DynTranslCtx);
}

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-base ${s <= rating ? "text-yellow-400" : "text-slate-200"}`}>★</span>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className={`text-3xl transition-transform active:scale-90 ${
            s <= (hovered || value) ? "text-yellow-400" : "text-slate-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image_url?: string;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type GalleryImage = { id: string; url: string };

type OffPeakSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  days_of_week: number[];
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  cuisine: string;
  coverImage: string;
  menu: MenuCategory[];
  primaryColor?: string;
  welcomeMessage?: string;
  isDemo?: boolean;
  images?: GalleryImage[];
  mapsUrl?: string;
  onlinePaymentEnabled?: boolean;
};

type Tab = "menu" | "reservation" | "info" | "evenements";
type CartItem = { item: MenuItem; quantity: number };

// ── Category Pills ────────────────────────────────────────────────────────────

function CategoryPills({
  menu,
  active,
  onSelect,
}: {
  menu: MenuCategory[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const primary = useContext(PrimaryColorCtx);
  const tr = useDynTr();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {menu.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={
            active === cat.id
              ? { backgroundColor: primary, color: "#fff" }
              : { backgroundColor: "#fff", border: "1px solid #e2e8f0", color: "#475569" }
          }
        >
          {tr(cat.name)}
        </button>
      ))}
    </div>
  );
}

// ── Sous-composants couleur ───────────────────────────────────────────────────

function PriceDisplay({ price }: { price: number }) {
  const primary = useContext(PrimaryColorCtx);
  const discount = useContext(OffPeakDiscountCtx);
  if (discount > 0) {
    const discounted = Math.round(price * (1 - discount / 100));
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-400 line-through leading-none">
          {price.toLocaleString("fr-FR")} FCFA
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-extrabold text-base" style={{ color: primary }}>
            {discounted.toLocaleString("fr-FR")}
          </span>
          <span className="text-xs font-medium" style={{ color: primary, opacity: 0.7 }}>FCFA</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-extrabold text-base" style={{ color: primary }}>
        {price.toLocaleString("fr-FR")}
      </span>
      <span className="text-xs font-medium" style={{ color: primary, opacity: 0.7 }}>FCFA</span>
    </div>
  );
}

function AddButton({ qty, onAdd }: { qty: number; onAdd: () => void }) {
  const primary = useContext(PrimaryColorCtx);
  return (
    <button
      onClick={onAdd}
      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95"
      style={
        qty > 0
          ? { backgroundColor: primary, color: "#fff" }
          : { backgroundColor: primary + "18", color: primary }
      }
    >
      {qty > 0 ? qty : "+"}
    </button>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab({
  menu,
  cart,
  onAdd,
  popularItems,
}: {
  menu: MenuCategory[];
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  popularItems: { mostOrdered: string | null; trending: string[] };
}) {
  const t = useT();
  const tr = useDynTr();
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const current = menu.find((c) => c.id === activeCategory);

  if (menu.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-5xl mb-3">🍽️</div>
        <p className="text-sm font-medium">{t.menuEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CategoryPills menu={menu} active={activeCategory} onSelect={setActiveCategory} />

      {current && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">{tr(current.name)}</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {t.dishCount(current.items.length)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {current.items.map((item) => {
              const qty = cart.find((c) => c.item.id === item.id)?.quantity ?? 0;
              return (
                <div
                  key={item.id}
                  className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                    item.available
                      ? "border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50/60"
                      : "border-slate-100 opacity-55"
                  }`}
                >
                  {qty > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 z-10" />
                  )}

                  {item.image_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm leading-snug">
                        {tr(item.name)}
                      </span>
                      {!item.available && (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                          {t.unavailable}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {popularItems.mostOrdered === item.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                          {t.badgeMostOrdered}
                        </span>
                      )}
                      {popularItems.trending.includes(item.name) && popularItems.mostOrdered !== item.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                          {t.badgeTrending}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {tr(item.description)}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <PriceDisplay price={item.price} />
                      {item.available && (
                        <AddButton qty={qty} onAdd={() => onAdd(item)} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panier (drawer) ───────────────────────────────────────────────────────────

function CartDrawer({
  cart,
  restaurantId,
  initialTable,
  isDemo,
  onlinePaymentEnabled,
  onClose,
  onRemove,
  onAdd,
  onClear,
}: {
  cart: CartItem[];
  restaurantId: string;
  initialTable?: string;
  isDemo?: boolean;
  onlinePaymentEnabled?: boolean;
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onAdd: (item: MenuItem) => void;
  onClear: () => void;
}) {
  const t = useT();
  const [tableNumber, setTableNumber] = useState(initialTable ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [payingOrder, setPayingOrder] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ provider: string; name: string; shortName: string; color: string; logo: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState<{ enabled: boolean; points: number; threshold: number; reward: string; earned: number } | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_amount: number; type: string; value: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Réduction heures creuses active (contexte partagé avec PriceDisplay)
  const offPeakDiscount = useContext(OffPeakDiscountCtx);
  const discountedPrice = (price: number) =>
    offPeakDiscount > 0 ? Math.round(price * (1 - offPeakDiscount / 100)) : price;

  const rawTotal      = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const offPeakSaving = rawTotal - cart.reduce((s, c) => s + discountedPrice(c.item.price) * c.quantity, 0);
  const totalAfterOffPeak = rawTotal - offPeakSaving;           // prix réduits appliqués
  const promoDeduction    = promoApplied?.discount_amount ?? 0;
  const finalTotal = Math.max(0, totalAfterOffPeak - promoDeduction);
  const itemsText = cart.map((c) => `${c.quantity}x ${c.item.name}`).join(", ");

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, code: promoInput.trim(), total: totalAfterOffPeak }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ code: data.code, discount_amount: data.discount_amount, type: data.type, value: data.value });
      } else {
        setPromoError(data.message ?? "Code invalide");
      }
    } catch {
      setPromoError("Erreur de connexion");
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleOrder() {
    if (!tableNumber.trim()) {
      setError(t.tableRequired);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 600));
        setOrderId("demo-order");
        setSuccess(true);
        onClear();
        return;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_number: tableNumber.trim(),
          items: itemsText,
          total: finalTotal,
          customer_name: customerName.trim() || undefined,
          customer_phone: customerPhone.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          promo_code: promoApplied?.code || undefined,
          discount_amount: promoApplied?.discount_amount || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la commande");
      }
      const data = await res.json();
      setOrderId(data.id ?? null);
      setSuccess(true);
      onClear();
      // Charger les méthodes de paiement disponibles pour ce restaurant
      fetch(`/api/orders/payment-config/${restaurantId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.enabled && d.methods?.length > 0) {
            setPaymentMethods(d.methods);
            setSelectedProvider(d.methods[0].provider);
          }
        })
        .catch(() => {});
      // Récupérer les points de fidélité si téléphone fourni
      if (customerPhone.trim()) {
        fetch(`/api/loyalty?restaurant_id=${restaurantId}&phone=${encodeURIComponent(customerPhone.trim())}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.enabled) {
              setLoyaltyInfo({
                enabled: true,
                points: d.points,
                threshold: d.threshold,
                reward: d.reward,
                earned: d.points_per_order ?? 1,
              });
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayOrder() {
    if (!orderId) return;
    setPayingOrder(true);
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          provider: selectedProvider ?? undefined,
          customer_name: customerName.trim() || undefined,
          customer_phone: customerPhone.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.payment_url;
      }
    } finally {
      setPayingOrder(false);
    }
  }

  async function handleReview() {
    if (reviewRating === 0) return;
    setReviewLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        order_id: orderId,
        rating: reviewRating,
        comment: reviewComment || null,
        customer_name: reviewName || null,
      }),
    });
    setReviewLoading(false);
    setReviewSubmitted(true);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900 text-lg">{t.cartTitle}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {success ? (
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                  🎉
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{t.orderSentTitle}</h3>
                <p className="text-slate-500 text-sm">{t.orderSentDesc}</p>
              </div>

              {/* Bloc fidélité */}
              {loyaltyInfo?.enabled && (
                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">🎁</div>
                  <p className="font-bold text-orange-700 text-sm">
                    {t.loyaltyEarned(loyaltyInfo.earned)}
                  </p>
                  <p className="text-orange-600 text-xs mt-0.5">
                    {t.loyaltyTotal} : <strong>{loyaltyInfo.points} pts</strong> / {loyaltyInfo.threshold} pts
                  </p>
                  {loyaltyInfo.points >= loyaltyInfo.threshold ? (
                    <p className="text-emerald-600 font-bold text-xs mt-1">
                      🎉 {t.loyaltyRewardReady} : {loyaltyInfo.reward} !
                    </p>
                  ) : (
                    <p className="text-orange-500 text-xs mt-1">
                      {t.loyaltyPointsLeft(loyaltyInfo.threshold - loyaltyInfo.points)} : {loyaltyInfo.reward}
                    </p>
                  )}
                  <div className="mt-2 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((loyaltyInfo.points / loyaltyInfo.threshold) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sélecteur + bouton paiement Mobile Money */}
              {orderId && !isDemo && onlinePaymentEnabled && paymentMethods.length > 0 && (
                <div className="mb-4 space-y-2">
                  {/* Sélecteur opérateur si plusieurs disponibles */}
                  {paymentMethods.length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Choisir votre opérateur</p>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((m) => (
                          <button
                            key={m.provider}
                            onClick={() => setSelectedProvider(m.provider)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                              selectedProvider === m.provider
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${m.color}`}>
                              {m.logo}
                            </span>
                            {m.shortName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bouton payer */}
                  <button
                    onClick={handlePayOrder}
                    disabled={payingOrder || !selectedProvider}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {payingOrder ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirection…</>
                    ) : (
                      <>
                        📱 Payer via {paymentMethods.find((m) => m.provider === selectedProvider)?.name ?? "Mobile Money"}
                      </>
                    )}
                  </button>
                </div>
              )}

              {reviewSubmitted ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🌟</div>
                  <p className="font-bold text-slate-900 mb-1">{t.reviewThanks}</p>
                  <PrimaryBtn className="mt-4 px-8 py-3 text-sm" onClick={onClose}>
                    {t.closeBtn}
                  </PrimaryBtn>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                  <p className="font-bold text-slate-900 text-center text-sm">{t.reviewPrompt}</p>
                  <div className="flex justify-center">
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>
                  {reviewRating > 0 && (
                    <>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={t.reviewCommentPlaceholder}
                        rows={2}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                      />
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder={t.reviewNamePlaceholder}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </>
                  )}
                  <div className="flex gap-2">
                    <PrimaryBtn
                      className="flex-1 py-3 text-sm disabled:opacity-60"
                      onClick={handleReview}
                      disabled={reviewRating === 0 || reviewLoading}
                    >
                      {reviewLoading ? t.sendingReview : t.sendReview}
                    </PrimaryBtn>
                    <button
                      onClick={onClose}
                      className="text-slate-400 text-sm px-4 hover:text-slate-600 transition-colors"
                    >
                      {t.noThanks}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-sm font-medium">{t.cartEmpty}</p>
              <p className="text-xs mt-1">{t.cartEmptyHint}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">{item.name}</div>
                    <div className="text-xs font-bold mt-0.5">
                      {offPeakDiscount > 0 ? (
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="line-through text-slate-300">
                            {(item.price * quantity).toLocaleString("fr-FR")}
                          </span>
                          <span className="text-orange-600">
                            {(discountedPrice(item.price) * quantity).toLocaleString("fr-FR")} FCFA
                          </span>
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          {(item.price * quantity).toLocaleString("fr-FR")} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-extrabold text-slate-900 text-sm">
                      {quantity}
                    </span>
                    <AddButton qty={0} onAdd={() => onAdd(item)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!success && cart.length > 0 && (
          /* ── Footer panier : 3 zones (récap visible + formulaire scrollable + boutons fixes) ── */
          <div className="border-t border-slate-100 bg-white flex flex-col shrink-0" style={{ maxHeight: "65vh" }}>

            {/* ── Zone 1 : Récap total — toujours visible en haut ── */}
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-slate-100 space-y-1">
              {error && (
                <div className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
                  {error}
                </div>
              )}
              {offPeakDiscount > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Sous-total</span>
                    <span className="text-slate-400 line-through">{rawTotal.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-600 font-semibold">🔥 Heures creuses −{offPeakDiscount}%</span>
                    <span className="text-orange-600 font-semibold">
                      −{offPeakSaving.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </>
              )}
              {promoApplied && (
                <>
                  {!offPeakDiscount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Sous-total</span>
                      <span className="text-slate-400 line-through">{rawTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 font-semibold">✓ Code {promoApplied.code}</span>
                    <span className="text-emerald-600 font-semibold">
                      −{promoApplied.discount_amount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 text-sm font-semibold">{t.totalLabel}</span>
                <span className="font-extrabold text-slate-900 text-xl">
                  {finalTotal.toLocaleString("fr-FR")}{" "}
                  <span className="text-sm font-medium text-slate-500">FCFA</span>
                </span>
              </div>
            </div>

            {/* ── Zone 2 : Formulaire — scrollable ── */}
            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2 space-y-3 min-h-0">

              {/* Code promo */}
              <div className="space-y-1.5">
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs tracking-wide">
                        {promoApplied.code}
                      </span>
                      <span className="text-emerald-600 text-xs font-semibold">
                        −{promoApplied.discount_amount.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                    <button
                      onClick={() => { setPromoApplied(null); setPromoInput(""); setPromoError(""); }}
                      className="text-slate-400 hover:text-red-500 text-sm font-bold leading-none transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                      placeholder="Code promo"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400 uppercase"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {promoLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-red-500 text-xs px-1">{promoError}</p>
                )}
              </div>

              {/* Table */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t.tableLabel}
                </label>
                {initialTable ? (
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <span className="text-orange-600 font-extrabold text-sm flex-1">{tableNumber}</span>
                    <span className="text-orange-400 text-xs">{t.tableViaQr}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => { setTableNumber(e.target.value); setError(null); }}
                    placeholder={t.tablePlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                )}
              </div>

              {/* Nom + Téléphone */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.firstnamePlaceholder}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                />
              </div>

              {/* Email */}
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={t.emailOrderPlaceholder}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              />
              <p className="text-xs text-slate-400 -mt-1.5">{t.optionalHint}</p>
            </div>

            {/* ── Zone 3 : Boutons — toujours visibles en bas ── */}
            <div className="px-5 py-4 shrink-0 border-t border-slate-100 bg-white flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <PrimaryBtn className="flex-[2] py-3.5 text-sm disabled:opacity-60" onClick={handleOrder} disabled={loading}>
                {loading ? t.orderLoading : `Commander · ${finalTotal.toLocaleString("fr-FR")} FCFA`}
              </PrimaryBtn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Onglet Réservation ────────────────────────────────────────────────────────

function ReservationTab({ name, restaurantId }: { name: string; restaurantId: string }) {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "", date: "", time: "", guests: "", message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests), restaurant_id: restaurantId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl">
          🎉
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{t.reservationSentTitle}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{t.reservationSentDesc(name)}</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ customer_name: "", customer_phone: "", customer_email: "", date: "", time: "", guests: "", message: "" });
          }}
          className="mt-6 text-orange-500 font-semibold text-sm hover:underline"
        >
          {t.newReservation}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">{t.reserveTitle}</h2>
        <p className="text-slate-400 text-sm mt-1">{t.reserveDesc}</p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t.nameLabel}</label>
            <input required name="customer_name" type="text" value={form.customer_name} onChange={handleChange}
              placeholder="Jean Koné"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t.phoneLabel}</label>
            <input required name="customer_phone" type="tel" value={form.customer_phone} onChange={handleChange}
              placeholder="+225 07 00 00"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            {t.emailLabel} <span className="normal-case font-normal text-slate-400">{t.emailOptional}</span>
          </label>
          <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange}
            placeholder="jean.kone@email.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t.dateLabel}</label>
            <input required name="date" type="date" value={form.date} onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t.timeLabel}</label>
            <select required name="time" value={form.time} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">{t.timeChoose}</option>
              {["12h00","12h30","13h00","13h30","19h00","19h30","20h00","20h30","21h00","21h30"].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{t.guestsLabel}</label>
          <select required name="guests" value={form.guests} onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">{t.guestsSelect}</option>
            {[1,2,3,4,5,6,7,8,10,12,15,20].map((n) => (
              <option key={n} value={n}>{t.guestOption(n)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            {t.messageLabel} <span className="normal-case font-normal text-slate-400">{t.messageOptional}</span>
          </label>
          <textarea name="message" rows={3} value={form.message} onChange={handleChange}
            placeholder={t.messagePlaceholder}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <PrimaryBtn className="w-full py-4 disabled:opacity-60" disabled={loading}>
          {loading ? t.orderLoading : t.confirmReservation}
        </PrimaryBtn>
      </form>
    </div>
  );
}

// ── Onglet Informations ───────────────────────────────────────────────────────

function InfoTab({ restaurant }: { restaurant: Restaurant }) {
  const t = useT();
  const primary = useContext(PrimaryColorCtx);
  const infos = [
    { icon: "📍", label: t.infoAddress, value: restaurant.address },
    { icon: "📞", label: t.infoPhone, value: restaurant.phone },
    { icon: "✉️", label: t.infoEmail, value: restaurant.email },
    { icon: "🕐", label: t.infoHours, value: restaurant.hours },
    { icon: "🍴", label: t.infoCuisine, value: restaurant.cuisine },
  ].filter((i) => i.value);

  const mapSrc = restaurant.mapsUrl
    ? restaurant.mapsUrl
    : restaurant.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(restaurant.address)}&t=m&z=15&output=embed&iwloc=near`
    : null;

  return (
    <div className="max-w-2xl space-y-5">
      {restaurant.description && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">{t.aboutTitle}</h2>
          <p className="text-slate-600 leading-relaxed text-sm">{restaurant.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infos.map(({ icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-100 transition-colors">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</div>
              <div className="text-slate-800 font-medium text-sm break-words">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {mapSrc && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              📍 {t.mapLocation}
            </h3>
            {restaurant.address && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-80"
                style={{ backgroundColor: primary }}
              >
                🧭 {t.getDirections}
              </a>
            )}
          </div>
          <div className="h-52 sm:h-72 w-full">
            <iframe
              src={mapSrc}
              className="w-full h-full border-0"
              loading="lazy"
              title={restaurant.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bouton primaire générique ─────────────────────────────────────────────────

function PrimaryBtn({
  children,
  className = "",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const primary = useContext(PrimaryColorCtx);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-bold rounded-xl transition-colors text-white ${className}`}
      style={{ backgroundColor: primary }}
    >
      {children}
    </button>
  );
}

// ── Section galerie photos ────────────────────────────────────────────────────

function GallerySection({ images }: { images: GalleryImage[] }) {
  const t = useT();
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <section className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-100">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">{t.galleryTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightbox(img.url)}
              className="aspect-square overflow-hidden rounded-2xl cursor-pointer group focus:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={t.galleryAlt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt={t.galleryAlt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ── Section avis ─────────────────────────────────────────────────────────────

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const t = useT();
  if (reviews.length === 0) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-100">
      <h2 className="text-lg font-extrabold text-slate-900 mb-4">{t.reviewsTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <StarDisplay rating={review.rating} />
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(review.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            {review.customer_name && (
              <p className="text-xs font-semibold text-slate-600 mb-1">{review.customer_name}</p>
            )}
            {review.comment && (
              <p className="text-slate-500 text-sm leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Onglet Événements ────────────────────────────────────────────────────────

type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  image_url: string | null;
  max_guests: number | null;
  price: number;
  event_reservations: { guests_count: number; status: string }[];
};

function EventsTab({ slug }: { slug: string }) {
  const t = useT();
  const primary = useContext(PrimaryColorCtx);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", guests: "1" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${slug}/events`)
      .then((r) => r.json())
      .then((data) => { setEvents(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  function seatsTaken(ev: PublicEvent) {
    return ev.event_reservations.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.guests_count, 0);
  }

  async function handleRegister(ev: PublicEvent) {
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${ev.id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_email: form.email.trim() || undefined,
          guests_count: Number(form.guests),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Erreur"); return; }
      setSuccessId(ev.id);
      setRegisteringId(null);
      setForm({ name: "", phone: "", email: "", guests: "1" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Chargement…</div>;

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <p className="font-bold text-slate-700 text-lg">{t.eventsEmpty}</p>
        <p className="text-slate-400 text-sm mt-2">{t.eventsEmptyHint}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-lg font-extrabold text-slate-900">{t.eventsTitle}</h2>
      {events.map((ev) => {
        const taken = seatsTaken(ev);
        const full = ev.max_guests !== null && taken >= ev.max_guests;
        const isRegistering = registeringId === ev.id;
        const isSuccess = successId === ev.id;
        const seatsLeft = ev.max_guests !== null ? ev.max_guests - taken : null;

        return (
          <div key={ev.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {ev.image_url && (
              <div className="h-40 w-full overflow-hidden">
                <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icône date */}
                <div className="shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: `${primary}15` }}>
                  <span className="text-[11px] font-bold uppercase leading-none" style={{ color: primary }}>
                    {new Date(ev.event_date + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                  <span className="text-xl font-extrabold leading-tight" style={{ color: primary }}>
                    {new Date(ev.event_date + "T00:00:00").getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">{ev.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(ev.event_date + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long", day: "numeric", month: "long",
                    })} à {ev.event_time.slice(0, 5)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {ev.price > 0 ? (
                      <span className="text-sm font-extrabold" style={{ color: primary }}>
                        {ev.price.toLocaleString("fr-FR")} FCFA
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-emerald-600">{t.eventFree}</span>
                    )}
                    {full ? (
                      <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-semibold">
                        {t.eventFull}
                      </span>
                    ) : seatsLeft !== null && seatsLeft <= 10 ? (
                      <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                        {t.eventSeatsLeft(seatsLeft)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {ev.description && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{ev.description}</p>
              )}

              {/* Succès */}
              {isSuccess && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
                  <p className="font-bold text-emerald-700 text-sm">{t.eventSuccessTitle}</p>
                  <p className="text-emerald-600 text-xs mt-1">{t.eventSuccessDesc}</p>
                </div>
              )}

              {/* Formulaire inscription */}
              {isRegistering && !isSuccess && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                  {formError && (
                    <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                      {formError}
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.eventNamePlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={t.eventPhonePlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t.eventEmailPlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.eventGuestsLabel}</label>
                    <select
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? "personne" : "personnes"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleRegister(ev)}
                      disabled={submitting || !form.name.trim() || !form.phone.trim()}
                      className="flex-1 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
                      style={{ backgroundColor: primary }}
                    >
                      {submitting ? t.eventRegistering : t.eventConfirm}
                    </button>
                    <button
                      onClick={() => { setRegisteringId(null); setFormError(""); }}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                    >
                      {t.eventCancelBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* Bouton inscription */}
              {!isRegistering && !isSuccess && !full && (
                <button
                  onClick={() => { setRegisteringId(ev.id); setFormError(""); setForm({ name: "", phone: "", email: "", guests: "1" }); }}
                  className="mt-4 w-full text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  style={{ backgroundColor: primary }}
                >
                  {t.eventRegister}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Barre appel serveur ───────────────────────────────────────────────────────

function WaiterCallBar({ restaurantId, tableNumber }: { restaurantId: string; tableNumber: string }) {
  const t = useT();
  const [sent, setSent] = useState<"waiter" | "bill" | null>(null);
  const [loading, setLoading] = useState(false);
  const primary = useContext(PrimaryColorCtx);

  async function sendCall(type: "waiter" | "bill") {
    if (loading || sent) return;
    setLoading(true);
    try {
      await fetch("/api/tables/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, table_number: tableNumber, type }),
      });
      setSent(type);
      setTimeout(() => setSent(null), 30_000);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-emerald-600 text-white px-4 py-3.5 flex items-center justify-between gap-3 shadow-2xl">
        <span className="text-sm font-semibold">
          {sent === "waiter" ? t.waiterComing : t.billComing}
        </span>
        <button onClick={() => setSent(null)} className="text-emerald-200 hover:text-white text-xs font-medium shrink-0">
          {t.waiterClose}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex gap-2.5 justify-center shadow-2xl">
      <button
        onClick={() => sendCall("waiter")}
        disabled={loading}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {t.callWaiter}
      </button>
      <button
        onClick={() => sendCall("bill")}
        disabled={loading}
        className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
        style={{ backgroundColor: primary }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {t.requestBill}
      </button>
    </div>
  );
}

// ── Sélecteur de langue ───────────────────────────────────────────────────────

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
      {(["fr", "en", "ar"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
            lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function RestaurantPageClient({
  restaurant,
  tableParam = "",
  paidOrderId = null,
  dashboardRole,
}: {
  restaurant: Restaurant;
  tableParam?: string;
  paidOrderId?: string | null;
  dashboardRole?: "owner" | "manager";
}) {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lang, setLang] = useState<Lang>("fr");
  const [dynCache, setDynCache] = useState<Record<string, string>>({});
  const [popularItems, setPopularItems] = useState<{ mostOrdered: string | null; trending: string[] }>({ mostOrdered: null, trending: [] });
  const heroImgRef = useRef<HTMLDivElement>(null);
  const primary = restaurant.primaryColor || "#f97316";
  const isDemo = restaurant.isDemo ?? false;

  useEffect(() => { setLang(detectLang()); }, []);

  useEffect(() => {
    function onScroll() {
      if (!heroImgRef.current) return;
      heroImgRef.current.style.transform = `translateY(${window.scrollY * 0.38}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Traduction dynamique des catégories et plats via MyMemory (gratuit, sans clé)
  useEffect(() => {
    if (lang === "fr") { setDynCache({}); return; }
    const texts: string[] = [];
    restaurant.menu.forEach((cat) => {
      texts.push(cat.name);
      cat.items.forEach((item) => {
        texts.push(item.name);
        if (item.description) texts.push(item.description);
      });
    });
    const unique = [...new Set(texts.filter(Boolean))];
    Promise.all(
      unique.map(async (text) => {
        const key = `tf_t_${text}::${lang}`;
        const cached = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        if (cached) return [text, cached] as [string, string];
        try {
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|${lang}`
          );
          const data = await res.json();
          const translated: string = data.responseData?.translatedText ?? text;
          localStorage.setItem(key, translated);
          return [text, translated] as [string, string];
        } catch {
          return [text, text] as [string, string];
        }
      })
    ).then((pairs) => {
      const newCache: Record<string, string> = {};
      pairs.forEach(([orig, trans]) => { newCache[orig] = trans; });
      setDynCache(newCache);
    });
  }, [lang, restaurant.menu]);

  const dynTr = (text: string) => (lang === "fr" ? text : dynCache[text] ?? text);

  useEffect(() => {
    fetch(`/api/popular-items?restaurant_id=${restaurant.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.mostOrdered !== undefined) setPopularItems(d); })
      .catch(() => {});
    const iv = setInterval(() => {
      fetch(`/api/popular-items?restaurant_id=${restaurant.id}`)
        .then((r) => r.json())
        .then((d) => { if (d.mostOrdered !== undefined) setPopularItems(d); })
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [restaurant.id]);

  useEffect(() => {
    fetch(`/api/reviews?restaurant_id=${restaurant.id}&limit=10`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data); })
      .catch(() => {});
  }, [restaurant.id]);

  const [offPeakSlots, setOffPeakSlots] = useState<OffPeakSlot[]>([]);
  const [offPeakActive, setOffPeakActive] = useState<{ slot: OffPeakSlot; secondsLeft: number } | null>(null);

  useEffect(() => {
    if (isDemo) return;
    fetch(`/api/off-peak-hours/active?restaurant_id=${restaurant.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOffPeakSlots(data); })
      .catch(() => {});
  }, [restaurant.id, isDemo]);

  useEffect(() => {
    if (offPeakSlots.length === 0) return;
    function computeActive() {
      const now = new Date();
      const day = now.getDay();
      const mins = now.getHours() * 60 + now.getMinutes();
      const seconds = now.getSeconds();
      for (const slot of offPeakSlots) {
        if (!slot.days_of_week.includes(day)) continue;
        const [sh, sm] = slot.start_time.split(":").map(Number);
        const [eh, em] = slot.end_time.split(":").map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        if (mins >= startMins && mins < endMins) {
          const secondsLeft = (endMins - mins) * 60 - seconds;
          setOffPeakActive({ slot, secondsLeft });
          return;
        }
      }
      setOffPeakActive(null);
    }
    computeActive();
    const iv = setInterval(computeActive, 1000);
    return () => clearInterval(iv);
  }, [offPeakSlots]);

  const t = translations[lang];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.item.id !== itemId);
      return prev.map((c) => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  // Applique la réduction heures creuses si active
  const cartTotal = offPeakActive
    ? cart.reduce((s, c) => s + Math.round(c.item.price * (1 - offPeakActive.slot.discount_percent / 100)) * c.quantity, 0)
    : cart.reduce((s, c) => s + c.item.price * c.quantity, 0);

  const tabs: { key: Tab; emoji: string; label: string }[] = [
    { key: "menu", emoji: "🍽️", label: t.tabMenu },
    { key: "reservation", emoji: "📅", label: t.tabReservation },
    { key: "evenements", emoji: "🎉", label: t.tabEvents },
    { key: "info", emoji: "ℹ️", label: t.tabInfo },
  ];

  return (
    <LangCtx.Provider value={lang}>
    <DynTranslCtx.Provider value={dynTr}>
    <PrimaryColorCtx.Provider value={primary}>
    <OffPeakDiscountCtx.Provider value={offPeakActive?.slot.discount_percent ?? 0}>
    <div className="min-h-screen bg-slate-50" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* ── Bannière paiement confirmé ── */}
      {paidOrderId && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-emerald-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">✓</span>
            <span className="text-sm font-semibold">{t.paymentConfirmed}</span>
          </div>
          <a
            href={`/receipt/${paidOrderId}`}
            className="shrink-0 bg-white text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            {t.viewReceipt}
          </a>
        </div>
      )}

      {/* ── Bannière heures creuses ── */}
      {offPeakActive && (
        <div className="fixed top-0 left-0 right-0 z-[65] bg-orange-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🔥</span>
            <div className="min-w-0">
              <span className="text-sm font-extrabold">−{offPeakActive.slot.discount_percent}% sur toute la carte</span>
              <span className="text-xs text-orange-100 ml-2 font-medium">{offPeakActive.slot.label}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] text-orange-200 font-medium leading-none mb-0.5">Offre se termine dans</div>
            <div className="text-sm font-extrabold tabular-nums">
              {String(Math.floor(offPeakActive.secondsLeft / 3600)).padStart(2, "0")}:
              {String(Math.floor((offPeakActive.secondsLeft % 3600) / 60)).padStart(2, "0")}:
              {String(offPeakActive.secondsLeft % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      )}

      {/* ── Bannière démo ── */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-400 text-amber-900 text-center text-xs font-bold py-2 px-4 flex items-center justify-center gap-2">
          <span>⚠️</span>
          {t.demoBanner}
          <a href="/inscription" className="ml-3 underline font-extrabold hover:text-amber-700">
            {t.demoCreate}
          </a>
        </div>
      )}

      {/* ── Bouton retour dashboard (gérant/propriétaire uniquement) ── */}
      {dashboardRole && (
        <a
          href="/dashboard"
          className="fixed bottom-6 right-4 z-[80] flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl transition-colors"
          title="Retour au tableau de bord"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span>Dashboard</span>
          <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full leading-none">
            {dashboardRole === "owner" ? "Propriétaire" : "Gérant"}
          </span>
        </a>
      )}

      {/* ── Navbar ── */}
      <nav className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm ${paidOrderId ? "top-12" : offPeakActive ? "top-12" : isDemo ? "top-8" : "top-0"}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 truncate leading-tight">{restaurant.name}</div>
            <div className="flex items-center gap-2">
              {restaurant.cuisine && (
                <span className="text-xs text-slate-400 leading-tight">{restaurant.cuisine}</span>
              )}
              {tableParam && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full leading-tight">
                  {tableParam}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <LangSwitcher lang={lang} setLang={setLang} />
            <button
              onClick={() => setCartOpen(true)}
              className="hidden sm:flex relative items-center gap-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <span>🛒</span>
              {cartCount > 0 ? (
                <span className="font-extrabold text-orange-600">{t.cartArticle(cartCount)}</span>
              ) : (
                <span>{t.cartLabel}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reservation")}
              className="text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: primary }}
            >
              {t.reserveBtn}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-72 md:h-[520px] pt-14 overflow-hidden">
        <div
          ref={heroImgRef}
          className="absolute inset-0 scale-[1.25] pointer-events-none"
          style={{
            backgroundImage: `url(${restaurant.coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.cuisine && (
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow"
                  style={{ backgroundColor: primary }}>
                  {restaurant.cuisine}
                </span>
              )}
              {restaurant.hours && (
                <span className="bg-white/15 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                  🕐 {restaurant.hours}
                </span>
              )}
              {restaurant.address && (
                <span className="bg-white/15 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20 hidden sm:inline-flex">
                  📍 {restaurant.address}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-xl">
              {restaurant.name}
            </h1>
            {restaurant.tagline && (
              <p className="text-white/70 text-sm mt-1.5 font-medium">{restaurant.tagline}</p>
            )}
            {restaurant.welcomeMessage && (
              <p className="text-white/90 text-sm mt-1 font-semibold">{restaurant.welcomeMessage}</p>
            )}
            {avgRating && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-yellow-400 text-base">★</span>
                <span className="text-white font-bold text-sm">{avgRating}</span>
                <span className="text-white/60 text-xs">({reviews.length} avis)</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 py-4 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all"
              style={
                activeTab === key
                  ? { borderColor: primary, color: primary }
                  : { borderColor: "transparent", color: "#64748b" }
              }
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <main className={`max-w-5xl mx-auto px-4 py-6 ${tableParam && !isDemo ? "pb-40 sm:pb-24" : "pb-28 sm:pb-10"}`}>
        {activeTab === "menu" && (
          <MenuTab menu={restaurant.menu} cart={cart} onAdd={addToCart} popularItems={popularItems} />
        )}
        {activeTab === "reservation" && (
          <ReservationTab name={restaurant.name} restaurantId={restaurant.id} />
        )}
        {activeTab === "evenements" && <EventsTab slug={restaurant.slug} />}
        {activeTab === "info" && <InfoTab restaurant={restaurant} />}
      </main>

      {/* ── Galerie photos ── */}
      <GallerySection images={restaurant.images ?? []} />

      {/* ── Avis clients ── */}
      <ReviewsSection reviews={reviews} />

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-xs text-slate-400">
          © {restaurant.name} · {t.poweredBy}{" "}
          <span className="font-bold text-orange-500">TableFlow</span>
        </p>
      </footer>

      {/* ── Barre panier mobile ── */}
      {cartCount > 0 && (
        <div className={`fixed ${tableParam && !isDemo ? "bottom-20" : "bottom-4"} left-4 right-4 z-40 sm:hidden`}>
          <button
            onClick={() => setCartOpen(true)}
            className="w-full text-white font-bold py-4 px-5 rounded-2xl shadow-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
            style={{ backgroundColor: primary }}
          >
            <span className="flex items-center gap-2.5">
              <span className="bg-white/25 rounded-lg w-8 h-8 flex items-center justify-center text-sm font-extrabold">
                {cartCount}
              </span>
              <span>{t.viewCart}</span>
            </span>
            <span className="font-extrabold text-sm">
              {cartTotal.toLocaleString("fr-FR")} FCFA
            </span>

          </button>
        </div>
      )}

      {/* ── Barre appel serveur ── */}
      {tableParam && !isDemo && !cartOpen && (
        <WaiterCallBar restaurantId={restaurant.id} tableNumber={tableParam} />
      )}

      {/* ── Drawer panier ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          restaurantId={restaurant.id}
          initialTable={tableParam}
          isDemo={isDemo}
          onlinePaymentEnabled={restaurant.onlinePaymentEnabled ?? false}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onAdd={addToCart}
          onClear={() => setCart([])}
        />
      )}

      {/* ── Chat en direct ── */}
      {!isDemo && <ChatWidget restaurantId={restaurant.id} />}
    </div>
    </OffPeakDiscountCtx.Provider>
    </PrimaryColorCtx.Provider>
    </DynTranslCtx.Provider>
    </LangCtx.Provider>
  );
}
