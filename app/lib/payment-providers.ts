// ================================================================
// TableFlow — Définitions des opérateurs de paiement Mobile Money
// Source unique de vérité pour le frontend ET le backend.
// ================================================================

export type ProviderId = "wave" | "orange_money" | "mtn_money" | "moov_money";

export type ProviderField = {
  key: string;           // nom du champ côté DB (merchant_id | api_key | api_secret | webhook_secret | extra_config.xxx)
  label: string;
  placeholder: string;
  type: "text" | "password";
  required: boolean;
  hint?: string;
};

export type ProviderDef = {
  id: ProviderId;
  name: string;
  shortName: string;
  color: string;          // Tailwind bg class
  textColor: string;      // Tailwind text class
  borderColor: string;    // Tailwind border class
  logo: string;           // emoji fallback
  fields: ProviderField[];
  docUrl?: string;
};

export const PROVIDERS: ProviderDef[] = [
  {
    id: "wave",
    name: "Wave",
    shortName: "Wave",
    color: "bg-sky-500",
    textColor: "text-sky-600",
    borderColor: "border-sky-200",
    logo: "〰️",
    docUrl: "https://www.wave.com/fr/",
    fields: [
      {
        key: "api_key",
        label: "API Key Wave",
        placeholder: "wave_sn_prod_XXXXXXXX",
        type: "password",
        required: true,
        hint: "Disponible dans votre espace marchand Wave → Paramètres → API",
      },
      {
        key: "webhook_secret",
        label: "Webhook Secret",
        placeholder: "whsec_XXXXXXXX",
        type: "password",
        required: false,
        hint: "Optionnel — pour la vérification des notifications de paiement",
      },
    ],
  },
  {
    id: "orange_money",
    name: "Orange Money",
    shortName: "Orange",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    logo: "🟠",
    docUrl: "https://developer.orange.com/apis/om-webpay",
    fields: [
      {
        key: "merchant_id",
        label: "Merchant ID",
        placeholder: "OM-MERCHANT-XXXXX",
        type: "text",
        required: true,
        hint: "Votre identifiant marchand Orange Money",
      },
      {
        key: "api_key",
        label: "Client ID (Authorization)",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        type: "password",
        required: true,
      },
      {
        key: "api_secret",
        label: "Client Secret",
        placeholder: "XXXXXXXXXXXXXXXXXX",
        type: "password",
        required: true,
      },
    ],
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    shortName: "MTN MoMo",
    color: "bg-yellow-400",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    logo: "🟡",
    docUrl: "https://momodeveloper.mtn.com/",
    fields: [
      {
        key: "merchant_id",
        label: "Subscription Key",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "password",
        required: true,
        hint: "Ocp-Apim-Subscription-Key dans le portail MoMo Developer",
      },
      {
        key: "api_key",
        label: "API User (UUID)",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        type: "text",
        required: true,
      },
      {
        key: "api_secret",
        label: "API Key",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "password",
        required: true,
      },
    ],
  },
  {
    id: "moov_money",
    name: "Moov Money",
    shortName: "Moov",
    color: "bg-blue-600",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    logo: "🔵",
    docUrl: "https://www.moov-africa.bj/",
    fields: [
      {
        key: "merchant_id",
        label: "Merchant ID",
        placeholder: "MOOV-XXXXXXXXXXXX",
        type: "text",
        required: true,
      },
      {
        key: "api_key",
        label: "API Key",
        placeholder: "mk_live_XXXXXXXX",
        type: "password",
        required: true,
      },
      {
        key: "api_secret",
        label: "API Secret",
        placeholder: "sk_live_XXXXXXXX",
        type: "password",
        required: true,
      },
    ],
  },
];

/** Retrouve une définition de provider par son id */
export function getProvider(id: ProviderId): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Configuration d'une méthode pour un restaurant (côté DB) */
export type RestaurantPaymentMethod = {
  id: string;
  restaurant_id: string;
  provider: ProviderId;
  enabled: boolean;
  merchant_id: string | null;
  api_key: string | null;
  api_secret: string | null;
  webhook_secret: string | null;
  extra_config: Record<string, string> | null;
  updated_at: string;
};

/** Version publique exposée au client final — sans les clés */
export type PublicPaymentMethod = {
  provider: ProviderId;
  name: string;
  shortName: string;
  color: string;
  logo: string;
};

/** Masque une clé API pour l'affichage dans le dashboard */
export function maskSecret(value: string | null): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••••••" + value.slice(-4);
}
