"use client";

import { useEffect, useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  position: number;
  image_url?: string | null;
};

type Category = {
  id: string;
  name: string;
  position: number;
  menu_items: MenuItem[];
};

async function fetchRestaurantId(): Promise<string> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return "";
  const data = await res.json();
  return data.restaurant?.id ?? "";
}

const EMPTY_FORM = {
  categoryId: "",
  newCategoryName: "",
  name: "",
  description: "",
  price: "",
  available: true,
  image_url: "",
};

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Modal ajout
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal édition
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", available: true, image_url: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    async function init() {
      const id = await fetchRestaurantId();
      if (!id) { setLoading(false); return; }
      setRestaurantId(id);
      await reloadMenu(id);
      setLoading(false);
    }
    init();
  }, []);

  async function reloadMenu(rid: string) {
    const r = await fetch(`/api/menu?restaurant_id=${rid}`);
    if (r.ok) {
      const data = await r.json();
      setCategories(data);
      setOpenCategories((prev) =>
        prev.size === 0 && data.length > 0 ? new Set([data[0].id]) : prev
      );
    }
  }

  function openModal() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "__new__" });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm({ ...EMPTY_FORM });
    setFormError("");
  }

  function openEdit(item: MenuItem, categoryId: string) {
    setEditItem(item);
    setEditCategoryId(categoryId);
    setEditForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      available: item.available,
      image_url: item.image_url ?? "",
    });
    setEditError("");
  }

  function closeEdit() {
    setEditItem(null);
    setEditError("");
  }

  async function handleAddDish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      let categoryId = form.categoryId;

      if (categoryId === "__new__") {
        if (!form.newCategoryName.trim()) {
          setFormError("Veuillez saisir un nom de catégorie");
          return;
        }
        const catRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurant_id: restaurantId, name: form.newCategoryName.trim() }),
        });
        const catData = await catRes.json();
        if (!catRes.ok) { setFormError(catData.error); return; }
        categoryId = catData.id;
      }

      const res = await fetch("/api/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          available: form.available,
          image_url: form.image_url.trim() || null,
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

  async function handleEditDish(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    setEditError("");

    const res = await fetch(`/api/menu/items/${editItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        available: editForm.available,
        image_url: editForm.image_url.trim() || null,
      }),
    });

    if (res.ok) {
      await reloadMenu(restaurantId);
      closeEdit();
    } else {
      const d = await res.json();
      setEditError(d.error ?? "Erreur lors de la modification");
    }
    setEditSaving(false);
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
    (s, c) => s + c.menu_items.filter((i) => i.available).length, 0
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
          <p className="text-green-700 text-sm mt-0.5">
            {totalItems} plat{totalItems > 1 ? "s" : ""} ·{" "}
            <span className="text-green-600">{availableItems} disponible{availableItems > 1 ? "s" : ""}</span>
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
          <p className="text-green-700 text-sm mb-4">Votre menu est vide pour l&apos;instant.</p>
          <button onClick={openModal}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            ➕ Ajouter votre premier plat
          </button>
        </div>
      ) : (
        categories.map((cat) => {
          const isOpen = openCategories.has(cat.id);
          return (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h2 className="font-bold text-slate-900">{cat.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                {cat.menu_items.filter(i => !i.available).length > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                    {cat.menu_items.filter(i => !i.available).length} indispo
                  </span>
                )}
                <span className="text-xs text-green-700 font-medium">{cat.menu_items.length} plat{cat.menu_items.length > 1 ? "s" : ""}</span>
              </div>
            </button>

            {isOpen && (cat.menu_items.length === 0 ? (
              <div className="px-6 py-8 text-center text-green-700 text-sm border-t border-slate-50">Aucun plat dans cette catégorie</div>
            ) : (
              <div className="divide-y divide-slate-50 border-t border-slate-50">
                {cat.menu_items.map((item) => (
                  <div key={item.id}
                    className="px-4 md:px-6 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    {/* Thumbnail */}
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-xl">🍽️</div>
                    )}

                    {/* Nom + badge + description + prix (mobile) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.available ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          {item.available ? "Dispo" : "Indispo"}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{item.description}</p>
                      )}
                      <p className="text-slate-900 font-bold text-sm mt-1">
                        {item.price.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Modifier */}
                      <button
                        onClick={() => openEdit(item, cat.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Activer / Désactiver */}
                      <button
                        onClick={() => toggleAvailable(item)}
                        disabled={toggling === item.id}
                        title={item.available ? "Désactiver" : "Activer"}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                          item.available
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            : "bg-orange-50 hover:bg-orange-100 text-orange-600"
                        }`}
                      >
                        {toggling === item.id ? (
                          <span className="text-xs font-bold">…</span>
                        ) : item.available ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      {/* Supprimer */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );})
      )}

      {/* ── Modal Nouveau plat ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Nouveau plat</h2>
              <button onClick={closeModal} className="p-1.5 text-green-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddDish} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="__new__">➕ Nouvelle catégorie…</option>
                </select>
              </div>
              {form.categoryId === "__new__" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la nouvelle catégorie</label>
                  <input
                    value={form.newCategoryName}
                    onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                    required={form.categoryId === "__new__"}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                    placeholder="Ex : Entrées, Plats, Desserts…"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du plat <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="Ex : Thiéboudienne, Attiéké poisson…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-green-700 font-normal">(optionnel)</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
                  placeholder="Ingrédients, accompagnements…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Prix (FCFA) <span className="text-red-400">*</span></label>
                <input
                  type="number" min="0" step="50"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  placeholder="Ex : 3500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Photo du plat <span className="text-green-700 font-normal">(optionnel)</span>
                </label>
                <ImageUpload
                  value={form.image_url}
                  restaurantId={restaurantId}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700">Disponible immédiatement</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, available: !form.available })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.available ? "bg-orange-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.available ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                  {saving ? "Ajout en cours…" : "Ajouter le plat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Modifier un plat ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Modifier le plat</h2>
              <button onClick={closeEdit} className="p-1.5 text-green-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditDish} className="px-6 py-5 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{editError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du plat <span className="text-red-400">*</span></label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-green-700 font-normal">(optionnel)</span></label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Prix (FCFA) <span className="text-red-400">*</span></label>
                <input
                  type="number" min="0" step="50"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Photo du plat <span className="text-green-700 font-normal">(optionnel)</span>
                </label>
                <ImageUpload
                  value={editForm.image_url}
                  restaurantId={restaurantId}
                  onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700">Disponible</span>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, available: !editForm.available })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editForm.available ? "bg-orange-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.available ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit}
                  className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  {editSaving ? "Sauvegarde…" : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant upload d'image ─────────────────────────────────────────────────

function ImageUpload({
  value,
  restaurantId,
  onChange,
}: {
  value: string;
  restaurantId: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(file: File) {
    setUploadError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("restaurant_id", restaurantId);

    try {
      const res = await fetch("/api/menu/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        setUploadError(data.error ?? "Erreur lors de l'upload");
      }
    } catch {
      setUploadError("Impossible de contacter le serveur");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-100 border border-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Photo du plat" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white transition-colors shadow text-sm font-bold"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-4 py-7 transition-colors ${
          uploading
            ? "border-orange-300 bg-orange-50 cursor-wait"
            : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 cursor-pointer"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <>
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-sm text-orange-600 font-semibold">Upload en cours…</span>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Choisir une photo</span>
            <span className="text-xs text-slate-400 mt-1">JPG · PNG · WebP — max 5 Mo</span>
          </>
        )}
      </label>
      {uploadError && (
        <p className="text-red-500 text-xs mt-1.5">{uploadError}</p>
      )}
    </div>
  );
}
