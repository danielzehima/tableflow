// ================================================================
// TableFlow — Devises des restaurants (FCFA / EUR / USD)
// Source unique de vérité pour le formatage des montants côté restaurant.
//
// MODÈLE : les prix sont TOUJOURS stockés en Franc CFA (XOF) en base.
// La devise du restaurant n'est qu'un choix d'AFFICHAGE : on convertit
// le montant XOF au moment de l'affichage (jamais en base).
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
// Taux de conversion — combien de FCFA (XOF) vaut 1 unité de la devise.
//  - EUR : taux FIXE officiel BCEAO (1 € = 655,96 FCFA) — ne change jamais.
//  - USD : taux FLOTTANT approximatif. Constante modifiable ici.
// ================================================================
export const EUR_RATE = 655.96; // 1 € = 655,96 FCFA
export const USD_RATE = 600;    // 1 $ ≈ 600 FCFA (ajustable)

export const XOF_PER_UNIT: Record<Currency, number> = {
  XOF: 1,
  EUR: EUR_RATE,
  USD: USD_RATE,
};

/**
 * Convertit un montant stocké en FCFA (XOF) vers la devise d'affichage.
 * Renvoie un NOMBRE non formaté (peut avoir des décimales).
 * Ex : convertCurrency(2500, "EUR") → 3.81  (2500 / 655,96)
 *      convertCurrency(2500, "USD") → 4.17  (2500 / 600)
 *      convertCurrency(2500, "XOF") → 2500
 */
export function convertCurrency(amountXof: number, currency: string | null | undefined): number {
  const n = Number.isFinite(amountXof) ? amountXof : 0;
  return n / XOF_PER_UNIT[asCurrency(currency)];
}

/**
 * Opération inverse : convertit un montant saisi DANS la devise d'affichage
 * vers la base FCFA (XOF). Utile pour la caisse (somme reçue, monnaie).
 * Ex : toBaseXof(5, "EUR") → 3280  (5 × 655,96)
 */
export function toBaseXof(amount: number, currency: string | null | undefined): number {
  const n = Number.isFinite(amount) ? amount : 0;
  return Math.round(n * XOF_PER_UNIT[asCurrency(currency)]);
}

/** Symbole court de la devise (pour les affichages où le nombre est séparé). */
export function currencySymbol(currency: string | null | undefined): string {
  return CURRENCIES[asCurrency(currency)].symbol;
}

/**
 * Formate un montant FCFA (base) dans la devise d'affichage du restaurant.
 * FCFA → entier ; EUR/USD → 2 décimales.
 * Ex : formatMoney(2500, "XOF") → "2 500 FCFA"
 *      formatMoney(2500, "EUR") → "3,81 €"
 *      formatMoney(2500, "USD") → "$4.17"
 */
export function formatMoney(amountXof: number, currency: string | null | undefined): string {
  const cfg = CURRENCIES[asCurrency(currency)];
  const value = convertCurrency(amountXof, cfg.code);
  const formatted =
    cfg.code === "XOF"
      ? Math.round(value).toLocaleString(cfg.locale)
      : value.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cfg.position === "prefix"
    ? `${cfg.symbol}${formatted}`
    : `${formatted} ${cfg.symbol}`;
}
