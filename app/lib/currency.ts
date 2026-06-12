// ================================================================
// TableFlow — Devises des restaurants (FCFA / EUR / USD)
// Source unique de vérité pour le formatage des montants côté restaurant.
//
// MODÈLE : devise NATIVE par restaurant. Chaque restaurant saisit, stocke
// et affiche ses prix dans SA devise. Pas de conversion à l'affichage.
//  - FCFA (XOF) : montants entiers
//  - EUR / USD  : 2 décimales (centimes)
// Les prix sont stockés en décimal (numeric) pour gérer les centimes.
// ================================================================

export type Currency = "XOF" | "EUR" | "USD";

export const DEFAULT_CURRENCY: Currency = "XOF";

type CurrencyConfig = {
  code: Currency;
  label: string;       // libellé affiché dans le sélecteur
  symbol: string;      // symbole court ("FCFA", "€", "$")
  locale: string;      // locale de formatage des nombres
  position: "prefix" | "suffix";
};

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  XOF: { code: "XOF", label: "Franc CFA (FCFA)", symbol: "FCFA", locale: "fr-FR", position: "suffix" },
  EUR: { code: "EUR", label: "Euro (€)",        symbol: "€",    locale: "fr-FR", position: "suffix" },
  USD: { code: "USD", label: "Dollar US ($)",   symbol: "$",    locale: "en-US", position: "prefix" },
};

/** Normalise une valeur potentiellement nulle/inconnue vers une devise valide. */
export function asCurrency(value: string | null | undefined): Currency {
  return value === "EUR" || value === "USD" || value === "XOF" ? value : DEFAULT_CURRENCY;
}

/** Nombre de décimales d'affichage/saisie selon la devise (FCFA: 0, EUR/USD: 2). */
export function currencyDecimals(currency: string | null | undefined): number {
  return asCurrency(currency) === "XOF" ? 0 : 2;
}

/** Pas de saisie d'un champ prix selon la devise (1 pour FCFA, 0.01 pour €/$). */
export function currencyStep(currency: string | null | undefined): number {
  return asCurrency(currency) === "XOF" ? 1 : 0.01;
}

/**
 * Arrondit un montant à la précision de la devise.
 * Indispensable pour les calculs (remises, totaux) afin d'éviter les
 * dérives de virgule flottante. FCFA → entier ; EUR/USD → 2 décimales.
 */
export function roundMoney(amount: number, currency: string | null | undefined): number {
  const f = Math.pow(10, currencyDecimals(currency));
  return Math.round((Number(amount) || 0) * f) / f;
}

/** Symbole court de la devise (pour les affichages où le nombre est séparé). */
export function currencySymbol(currency: string | null | undefined): string {
  return CURRENCIES[asCurrency(currency)].symbol;
}

/**
 * Formate un montant DANS la devise native du restaurant (aucune conversion).
 * FCFA → entier ; EUR/USD → 2 décimales.
 * Ex : formatMoney(2500, "XOF")  → "2 500 FCFA"
 *      formatMoney(12.5, "EUR")  → "12,50 €"
 *      formatMoney(12.5, "USD")  → "$12.50"
 */
export function formatMoney(amount: number, currency: string | null | undefined): string {
  const cfg = CURRENCIES[asCurrency(currency)];
  const d = currencyDecimals(cfg.code);
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = n.toLocaleString(cfg.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  return cfg.position === "prefix"
    ? `${cfg.symbol}${formatted}`
    : `${formatted} ${cfg.symbol}`;
}
