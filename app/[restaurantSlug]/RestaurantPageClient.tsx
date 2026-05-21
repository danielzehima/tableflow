"use client";

import { useState } from "react";
import Image from "next/image";

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
};

type Tab = "menu" | "reservation" | "info";
type CartItem = { item: MenuItem; quantity: number };

const tabLabels: Record<Tab, string> = {
  menu: "Menu",
  reservation: "Réserver",
  info: "Infos",
};

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
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {menu.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            active === cat.id
              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
              : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab({
  menu,
  cart,
  onAdd,
}: {
  menu: MenuCategory[];
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
}) {
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const current = menu.find((c) => c.id === activeCategory);

  if (menu.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-5xl mb-3">🍽️</div>
        <p className="text-sm font-medium">Le menu n&apos;est pas encore disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CategoryPills menu={menu} active={activeCategory} onSelect={setActiveCategory} />

      {current && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">{current.name}</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {current.items.length} plat{current.items.length > 1 ? "s" : ""}
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

                  {/* Photo du plat */}
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
                    {/* Nom + badge indisponible */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm leading-snug">
                        {item.name}
                      </span>
                      {!item.available && (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                          Indisponible
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Prix + bouton ajouter sur la même ligne */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-orange-600 font-extrabold text-base">
                          {item.price.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-orange-400 text-xs font-medium">FCFA</span>
                      </div>
                      {item.available && (
                        <button
                          onClick={() => onAdd(item)}
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 ${
                            qty > 0
                              ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                              : "bg-orange-50 text-orange-500 hover:bg-orange-100"
                          }`}
                        >
                          {qty > 0 ? qty : "+"}
                        </button>
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
  onClose,
  onRemove,
  onAdd,
  onClear,
}: {
  cart: CartItem[];
  restaurantId: string;
  initialTable?: string;
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onAdd: (item: MenuItem) => void;
  onClear: () => void;
}) {
  const [tableNumber, setTableNumber] = useState(initialTable ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const itemsText = cart.map((c) => `${c.quantity}x ${c.item.name}`).join(", ");

  async function handleOrder() {
    if (!tableNumber.trim()) {
      setError("Veuillez entrer un numéro de table");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_number: tableNumber.trim(),
          items: itemsText,
          total,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la commande");
      }
      setSuccess(true);
      onClear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900 text-lg">Mon panier</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {success ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                🎉
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Commande envoyée !</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Le restaurant a bien reçu votre commande et commence à la préparer.
              </p>
              <button
                onClick={onClose}
                className="mt-6 bg-orange-500 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-orange-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-sm font-medium">Votre panier est vide</p>
              <p className="text-xs mt-1">Ajoutez des plats depuis le menu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">{item.name}</div>
                    <div className="text-orange-600 text-xs font-bold mt-0.5">
                      {(item.price * quantity).toLocaleString("fr-FR")} FCFA
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
                    <button
                      onClick={() => onAdd(item)}
                      className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center hover:bg-orange-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!success && cart.length > 0 && (
          <div className="px-5 py-5 border-t border-slate-100 space-y-4 bg-white">
            {error && (
              <div className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="font-extrabold text-slate-900 text-xl">
                {total.toLocaleString("fr-FR")}{" "}
                <span className="text-sm font-medium text-slate-500">FCFA</span>
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Table
              </label>
              {initialTable ? (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <span className="text-orange-600 font-extrabold text-sm flex-1">{tableNumber}</span>
                  <span className="text-orange-400 text-xs">détectée via QR</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => { setTableNumber(e.target.value); setError(null); }}
                  placeholder="Ex : Table 5"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                />
              )}
            </div>
            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-sm shadow-lg shadow-orange-200"
            >
              {loading ? "Envoi en cours…" : `Commander · ${total.toLocaleString("fr-FR")} FCFA`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Onglet Réservation ────────────────────────────────────────────────────────

function ReservationTab({ name, restaurantId }: { name: string; restaurantId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", date: "", time: "", guests: "", message: "",
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
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Demande envoyée !</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {name} a bien reçu votre demande et vous confirmera dans les plus brefs délais.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ customer_name: "", customer_phone: "", date: "", time: "", guests: "", message: "" });
          }}
          className="mt-6 text-orange-500 font-semibold text-sm hover:underline"
        >
          Faire une nouvelle réservation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">Réserver une table</h2>
        <p className="text-slate-400 text-sm mt-1">
          Remplissez le formulaire · La confirmation vous sera envoyée par SMS
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nom</label>
            <input required name="customer_name" type="text" value={form.customer_name} onChange={handleChange}
              placeholder="Jean Koné"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Téléphone</label>
            <input required name="customer_phone" type="tel" value={form.customer_phone} onChange={handleChange}
              placeholder="+225 07 00 00"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
            <input required name="date" type="date" value={form.date} onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Heure</label>
            <select required name="time" value={form.time} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">Choisir</option>
              {["12h00","12h30","13h00","13h30","19h00","19h30","20h00","20h30","21h00","21h30"].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nombre de personnes</label>
          <select required name="guests" value={form.guests} onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">Sélectionner</option>
            {[1,2,3,4,5,6,7,8,10,12,15,20].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "personne" : "personnes"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Message <span className="normal-case font-normal text-slate-400">(optionnel)</span>
          </label>
          <textarea name="message" rows={3} value={form.message} onChange={handleChange}
            placeholder="Allergie, anniversaire, occasion spéciale…"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-200">
          {loading ? "Envoi en cours…" : "Confirmer la réservation"}
        </button>
      </form>
    </div>
  );
}

// ── Onglet Informations ───────────────────────────────────────────────────────

function InfoTab({ restaurant }: { restaurant: Restaurant }) {
  const infos = [
    { icon: "📍", label: "Adresse", value: restaurant.address },
    { icon: "📞", label: "Téléphone", value: restaurant.phone },
    { icon: "✉️", label: "Email", value: restaurant.email },
    { icon: "🕐", label: "Horaires", value: restaurant.hours },
    { icon: "🍴", label: "Cuisine", value: restaurant.cuisine },
  ].filter((i) => i.value);

  return (
    <div className="max-w-2xl space-y-5">
      {restaurant.description && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">À propos</h2>
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
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function RestaurantPageClient({
  restaurant,
  tableParam = "",
}: {
  restaurant: Restaurant;
  tableParam?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

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
  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
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
            <button
              onClick={() => setCartOpen(true)}
              className="hidden sm:flex relative items-center gap-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <span>🛒</span>
              {cartCount > 0 ? (
                <span className="font-extrabold text-orange-600">{cartCount} article{cartCount > 1 ? "s" : ""}</span>
              ) : (
                <span>Panier</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reservation")}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Réserver
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-64 md:h-96 pt-14 overflow-hidden">
        <Image
          src={restaurant.coverImage}
          alt={restaurant.name}
          fill
          className="object-cover object-center pointer-events-none"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 pointer-events-none" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <div className="max-w-5xl mx-auto">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.cuisine && (
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
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
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(["menu", "reservation", "info"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 py-4 px-5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "menu" && "🍽️"}
              {tab === "reservation" && "📅"}
              {tab === "info" && "ℹ️"}
              {" "}{tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 sm:pb-10">
        {activeTab === "menu" && (
          <MenuTab menu={restaurant.menu} cart={cart} onAdd={addToCart} />
        )}
        {activeTab === "reservation" && (
          <ReservationTab name={restaurant.name} restaurantId={restaurant.id} />
        )}
        {activeTab === "info" && <InfoTab restaurant={restaurant} />}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-xs text-slate-400">
          © {restaurant.name} · Propulsé par{" "}
          <span className="font-bold text-orange-500">TableFlow</span>
        </p>
      </footer>

      {/* ── Barre panier mobile (sticky bottom) ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 text-white font-bold py-4 px-5 rounded-2xl shadow-2xl shadow-orange-400/40 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center gap-2.5">
              <span className="bg-white/25 rounded-lg w-8 h-8 flex items-center justify-center text-sm font-extrabold">
                {cartCount}
              </span>
              <span>Voir le panier</span>
            </span>
            <span className="font-extrabold text-sm">
              {cartTotal.toLocaleString("fr-FR")} FCFA
            </span>
          </button>
        </div>
      )}

      {/* ── Drawer panier ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          restaurantId={restaurant.id}
          initialTable={tableParam}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onAdd={addToCart}
          onClear={() => setCart([])}
        />
      )}
    </div>
  );
}
