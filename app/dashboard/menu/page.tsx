"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  position: number;
};

type Category = {
  id: string;
  name: string;
  position: number;
  menu_items: MenuItem[];
};

function readSlug(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)restaurant_slug=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "le-bonus";
  } catch {
    return "le-bonus";
  }
}

const EMPTY_FORM = {
  categoryId: "",
  newCategoryName: "",
  name: "",
  description: "",
  price: "",
  available: true,
};

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function init() {
      const slug = readSlug();
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setRestaurantId(data.id);
      await reloadMenu(data.id);
      setLoading(false);
    }
    init();
  }, []);

  async function reloadMenu(rid: string) {
    const r = await fetch(`/api/menu?restaurant_id=${rid}`);
    if (r.ok) setCategories(await r.json());
  }

  function openModal() {
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "__new__",
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
    setFormError("");
  }

  async function handleAddDish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      let categoryId = form.categoryId;

      // Créer la catégorie si "Nouvelle catégorie" est sélectionnée
      if (categoryId === "__new__") {
        if (!form.newCategoryName.trim()) {
          setFormError("Veuillez saisir un nom de catégorie");
          return;
        }
        const catRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurant_id: restaurantId,
            name: form.newCategoryName.trim(),
          }),
        });
        const catData = await catRes.json();
        if (!catRes.ok) { setFormError(catData.error); return; }
        categoryId = catData.id;
      }

      // Créer le plat
      const res = await fetch("/api/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          available: form.available,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }

      await reloadMenu(restaurantId);
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(item: MenuItem) {
    setToggling(item.id);
    await fetch(`/api/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        menu_items: cat.menu_items.map((i) =>
          i.id === item.id ? { ...i, available: !i.available } : i
        ),
      }))
    );
    setToggling(null);
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Supprimer ce plat définitivement ?")) return;
    await fetch(`/api/menu/items/${itemId}`, { method: "DELETE" });
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        menu_items: cat.menu_items.filter((i) => i.id !== itemId),
      }))
    );
  }

  const totalItems = categories.reduce((s, c) => s + c.menu_items.length, 0);
  const availableItems = categories.reduce(
    (s, c) => s + c.menu_items.filter((i) => i.available).length,
    0
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-2xl h-40 border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Menu digital</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalItems} plat{totalItems > 1 ? "s" : ""} ·{" "}
            <span className="text-green-600">
              {availableItems} disponible{availableItems > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau plat
        </button>
      </div>

      {/* Categories + items */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500 text-sm mb-4">
            Votre menu est vide pour l&apos;instant.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            ➕ Ajouter votre premier plat
          </button>
        </div>
      ) : (
        categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{cat.name}</h2>
              <span className="text-xs text-slate-400">
                {cat.menu_items.length} plat{cat.menu_items.length > 1 ? "s" : ""}
              </span>
            </div>

            {cat.menu_items.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                Aucun plat dans cette catégorie
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {cat.menu_items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 md:px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {item.name}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            item.available
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.available ? "Disponible" : "Indisponible"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-slate-400 text-xs mt-0.5 truncate max-w-sm">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      <span className="font-bold text-slate-900 text-sm whitespace-nowrap">
                        {item.price.toLocaleString("fr-FR")} F
                      </span>
                      <button
                        onClick={() => toggleAvailable(item)}
                        disabled={toggling === item.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          item.available
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-700"
                        }`}
                      >
                        {toggling === item.id
                          ? "…"
                          : item.available
                          ? "Désactiver"
                          : "Activer"}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Supprimer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* ── Modal Nouveau plat ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* En-tête */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Nouveau plat</h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleAddDish} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Catégorie
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new__">➕ Nouvelle catégorie…</option>
                </select>
              </div>

              {/* Nom nouvelle catégorie */}
              {form.categoryId === "__new__" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nom de la nouvelle catégorie
                  </label>
                  <input
                    value={form.newCategoryName}
                    onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                    required={form.categoryId === "__new__"}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                    placeholder="Ex : Entrées, Plats, Desserts…"
                  />
                </div>
              )}

              {/* Nom du plat */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom du plat <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="Ex : Thiéboudienne, Attiéké poisson…"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description{" "}
                  <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
                  placeholder="Ingrédients, accompagnements…"
                />
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Prix (FCFA) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="Ex : 3500"
                />
              </div>

              {/* Disponibilité */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700">
                  Disponible immédiatement
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, available: !form.available })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    form.available ? "bg-orange-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.available ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  {saving ? "Ajout en cours…" : "Ajouter le plat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
