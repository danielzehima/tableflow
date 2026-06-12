// ================================================================
// TableFlow — Devises des restaurants (FCFA / EUR / USD)
// Source unique de vérité pour le formatage des montants côté restaurant.
// Les prix sont stockés en nombres entiers (unités entières de la devise).
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

// ================================================================
// Conversion entre devises
// Valeur d'1 unité de la devise, exprimée en FCFA (XOF).
//  - EUR : taux FIXE officiel BCEAO (1 € = 655,957 FCFA) — ne change jamais.
//  - USD : taux FLOTTANT (approximatif). Ajustable ici si besoin.
// ================================================================
export const XOF_PER_UNIT: Record<Currency, number> = {
  XOF: 1,
  EUR: 655.957,
  USD: 600,
};

/**
 * Convertit un montant d'une devise vers une autre.
 * Les prix étant stockés en nombres entiers, le résultat est arrondi.
 * Ex : convertAmount(2500, "XOF", "EUR") → 4   (2500 / 655,957 ≈ 3,81)
 *      convertAmount(4, "EUR", "XOF")    → 2624 (4 × 655,957)
 */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to || !Number.isFinite(amount)) return Math.round(amount) || 0;
  const xof = amount * XOF_PER_UNIT[from];
  return Math.round(xof / XOF_PER_UNIT[to]);
}

/** Symbole court de la devise (pour les affichages où le nombre est séparé). */
export function currencySymbol(currency: string | null | undefined): string {
  return CURRENCIES[asCurrency(currency)].symbol;
}

/**
 * Formate un montant selon la devise du restaurant.
 * Ex : formatMoney(1250, "XOF") → "1 250 FCFA"
 *      formatMoney(1250, "EUR") → "1 250 €"
 *      formatMoney(1250, "USD") → "$1,250"
 */
export function formatMoney(amount: number, currency: string | null | undefined): string {
  const cfg = CURRENCIES[asCurrency(currency)];
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = n.toLocaleString(cfg.locale);
  return cfg.position === "prefix"
    ? `${cfg.symbol}${formatted}`
    : `${formatted} ${cfg.symbol}`;
}
