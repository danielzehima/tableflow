"use client";

import { useEffect, useState } from "react";
import { PROVIDERS, type ProviderId, type ProviderDef } from "../../lib/payment-providers";

// ── Types ────────────────────────────────────────────────────────────────────

type MethodState = {
  provider: ProviderId;
  enabled: boolean;
  merchant_id: string;
  api_key: string;
  api_secret: string;
  webhook_secret: string;
  has_merchant_id: boolean;
  has_api_key: boolean;
  has_api_secret: boolean;
  has_webhook_secret: boolean;
  updated_at: string | null;
};

type GlobalSettings = {
  online_payment_enabled: boolean;
  api_key_set: boolean;
  api_secret_set: boolean;
  api_key_masked: string | null;
  api_secret_masked: string | null;
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function PaiementEnLignePage() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [methods, setMethods] = useState<MethodState[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>(null);
  const [savingProvider, setSavingProvider] = useState<ProviderId | null>(null);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formValues, setFormValues] = useState<Record<ProviderId, Record<string, string>>>({
    wave: {}, orange_money: {}, mtn_money: {}, moov_money: {},
  });

  // Champs visible/masqué
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/payment-settings").then((r) => r.json()),
      fetch("/api/dashboard/payment-methods").then((r) => r.json()),
    ]).then(([gs, ms]) => {
      setGlobalSettings(gs);
      setMethods(ms);
    }).catch(() => showToast("error", "Impossible de charger la configuration."))
      .finally(() => setLoading(false));
  }, []);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Toggle global (activer/désactiver le paiement en ligne) ───────────────
  async function toggleGlobal() {
    if (!globalSettings) return;
    setSavingGlobal(true);
    const newVal = !globalSettings.online_payment_enabled;
    const res = await fetch("/api/dashboard/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ online_payment_enabled: newVal }),
    });
    if (res.ok) {
      setGlobalSettings({ ...globalSettings, online_payment_enabled: newVal });
      showToast("success", newVal ? "Paiement en ligne activé." : "Paiement en ligne désactivé.");
    } else {
      showToast("error", "Erreur lors de la mise à jour.");
    }
    setSavingGlobal(false);
  }

  // ── Toggle opérateur (activer/désactiver) ─────────────────────────────────
  async function toggleProvider(provider: ProviderId) {
    const current = methods.find((m) => m.provider === provider);
    if (!current) return;
    setSavingProvider(provider);
    const newEnabled = !current.enabled;
    const res = await fetch("/api/dashboard/payment-methods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, enabled: newEnabled }),
    });
    if (res.ok) {
      setMethods((prev) => prev.map((m) => m.provider === provider ? { ...m, enabled: newEnabled } : m));
      if (newEnabled && !current.has_api_key) setExpandedProvider(provider);
      showToast("success", `${PROVIDERS.find((p) => p.id === provider)?.name} ${newEnabled ? "activé" : "désactivé"}.`);
    } else {
      showToast("error", "Erreur lors de la mise à jour.");
    }
    setSavingProvider(null);
  }

  // ── Sauvegarde des identifiants d'un opérateur ────────────────────────────
  async function saveProviderCredentials(provider: ProviderId) {
    setSavingProvider(provider);
    const values = formValues[provider] ?? {};
    const res = await fetch("/api/dashboard/payment-methods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...values }),
    });
    if (res.ok) {
      // Rafraîchir les indicateurs depuis le serveur
      const fresh = await fetch("/api/dashboard/payment-methods").then((r) => r.json());
      setMethods(fresh);
      setFormValues((prev) => ({ ...prev, [provider]: {} }));
      setExpandedProvider(null);
      showToast("success", "Identifiants enregistrés avec succès.");
    } else {
      const d = await res.json().catch(() => ({}));
      showToast("error", d.error ?? "Erreur lors de la sauvegarde.");
    }
    setSavingProvider(null);
  }

  function updateField(provider: ProviderId, field: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
  }

  function toggleFieldVisibility(key: string) {
    setShowFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Valeur affichée dans un champ (nouvelle valeur ou masque existant) ────
  function displayValue(provider: ProviderId, fieldKey: string, maskedValue: string): string {
    const typed = formValues[provider]?.[fieldKey];
    if (typed !== undefined) return typed;
    return maskedValue; // valeur masquée venant du serveur
  }

  const enabledCount = methods.filter((m) => m.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Paiement en ligne</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configurez les opérateurs Mobile Money que vos clients pourront utiliser.
          </p>
        </div>
      </div>

      {/* ── Toggle global ──────────────────────────────────────────────────── */}
      {globalSettings && (
        <div className={`rounded-2xl border-2 p-5 flex items-center justify-between gap-4 transition-colors ${
          globalSettings.online_payment_enabled
            ? "bg-emerald-50 border-emerald-200"
            : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <p className="font-bold text-slate-900 text-sm">Activer le paiement en ligne</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {globalSettings.online_payment_enabled
                ? `${enabledCount} opérateur${enabledCount > 1 ? "s" : ""} actif${enabledCount > 1 ? "s" : ""} — bouton visible sur votre page publique`
                : "Le bouton de paiement sera masqué sur votre page publique"}
            </p>
          </div>
          <button
            onClick={toggleGlobal}
            disabled={savingGlobal}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 disabled:opacity-60 ${
              globalSettings.online_payment_enabled ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
              globalSettings.online_payment_enabled ? "translate-x-8" : "translate-x-1"
            }`} />
          </button>
        </div>
      )}

      {/* ── Opérateurs ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Opérateurs disponibles
        </h2>

        {PROVIDERS.map((providerDef) => {
          const method = methods.find((m) => m.provider === providerDef.id);
          const isExpanded = expandedProvider === providerDef.id;
          const isSaving   = savingProvider === providerDef.id;
          const isEnabled  = method?.enabled ?? false;
          const isConfigured = method?.has_api_key ?? false;

          return (
            <ProviderCard
              key={providerDef.id}
              def={providerDef}
              method={method}
              isExpanded={isExpanded}
              isSaving={isSaving}
              isEnabled={isEnabled}
              isConfigured={isConfigured}
              formValues={formValues[providerDef.id] ?? {}}
              showFields={showFields}
              onToggle={() => toggleProvider(providerDef.id)}
              onExpand={() => setExpandedProvider(isExpanded ? null : providerDef.id)}
              onUpdateField={(field, value) => updateField(providerDef.id, field, value)}
              onToggleFieldVisibility={toggleFieldVisibility}
              onSave={() => saveProviderCredentials(providerDef.id)}
              displayValue={(fieldKey, masked) => displayValue(providerDef.id, fieldKey, masked)}
            />
          );
        })}
      </div>

      {/* ── URL Webhook ────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-1">URL Webhook universelle</h3>
        <p className="text-xs text-slate-500 mb-3">
          Configurez cette URL dans chaque espace marchand opérateur pour recevoir les confirmations de paiement.
        </p>
        <WebhookUrlBox />
      </div>

    </div>
  );
}

// ── Carte opérateur ───────────────────────────────────────────────────────────

function ProviderCard({
  def, method, isExpanded, isSaving, isEnabled, isConfigured,
  formValues, showFields,
  onToggle, onExpand, onUpdateField, onToggleFieldVisibility, onSave, displayValue,
}: {
  def: ProviderDef;
  method: MethodState | undefined;
  isExpanded: boolean;
  isSaving: boolean;
  isEnabled: boolean;
  isConfigured: boolean;
  formValues: Record<string, string>;
  showFields: Record<string, boolean>;
  onToggle: () => void;
  onExpand: () => void;
  onUpdateField: (field: string, value: string) => void;
  onToggleFieldVisibility: (key: string) => void;
  onSave: () => void;
  displayValue: (fieldKey: string, masked: string) => string;
}) {
  const hasUnsavedChanges = Object.values(formValues).some((v) => v.length > 0 && !v.includes("••"));

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
      isEnabled ? `${def.borderColor} shadow-sm` : "border-slate-200 bg-white"
    }`}>
      {/* En-tête de la carte */}
      <div className="flex items-center gap-4 p-4">
        {/* Logo opérateur */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 text-white ${def.color}`}>
          {def.logo}
        </div>

        {/* Nom + statut */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{def.name}</span>
            {isEnabled && isConfigured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                ✓ Configuré
              </span>
            )}
            {isEnabled && !isConfigured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                ⚠ Identifiants manquants
              </span>
            )}
          </div>
          {method?.updated_at && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Mis à jour le {new Date(method.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bouton configurer */}
          <button
            onClick={onExpand}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              isExpanded
                ? "bg-slate-200 text-slate-700"
                : `${def.textColor} bg-slate-100 hover:bg-slate-200`
            }`}
          >
            {isExpanded ? "Fermer" : "Configurer"}
          </button>

          {/* Toggle activer/désactiver */}
          <button
            onClick={onToggle}
            disabled={isSaving}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 disabled:opacity-50 ${
              isEnabled ? "bg-emerald-500" : "bg-slate-300"
            }`}
            title={isEnabled ? "Désactiver" : "Activer"}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              isEnabled ? "translate-x-5" : "translate-x-0.5"
            }`} />
          </button>
        </div>
      </div>

      {/* Zone de configuration (dépliable) */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 pb-5 pt-4 space-y-4">
          {def.docUrl && (
            <a href={def.docUrl} target="_blank" rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${def.textColor} hover:underline`}>
              📖 Documentation {def.name}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {def.fields.map((field) => {
            const fieldKey = `${def.id}_${field.key}`;
            const maskedValue = (() => {
              if (!method) return "";
              if (field.key === "merchant_id")   return method.has_merchant_id   ? "••••••••" : "";
              if (field.key === "api_key")        return method.has_api_key        ? "••••••••••••" : "";
              if (field.key === "api_secret")     return method.has_api_secret     ? "••••••••••••" : "";
              if (field.key === "webhook_secret") return method.has_webhook_secret ? "••••••••••••" : "";
              return "";
            })();

            const currentValue = displayValue(field.key, maskedValue);
            const isVisible = showFields[fieldKey] ?? false;

            return (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={field.type === "password" && !isVisible ? "password" : "text"}
                    value={currentValue}
                    onChange={(e) => onUpdateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => onToggleFieldVisibility(fieldKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  )}
                </div>
                {field.hint && (
                  <p className="text-[10px] text-slate-400 mt-1">{field.hint}</p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onExpand}
              className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-xs transition-colors hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 ${
                hasUnsavedChanges
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-slate-200 text-slate-400 cursor-default"
              } disabled:opacity-60`}
            >
              {isSaving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Webhook URL ───────────────────────────────────────────────────────────────

function WebhookUrlBox() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/api/paiement/webhook`
    : "/api/paiement/webhook";

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono truncate">
        {url}
      </code>
      <button
        onClick={copy}
        className="shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {copied ? "✓ Copié" : "Copier"}
      </button>
    </div>
  );
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
