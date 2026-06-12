"use client";

import { createContext, useContext } from "react";
import { formatMoney, type Currency } from "../../lib/currency";

// Devise du restaurant, fournie globalement dans le dashboard.
export const CurrencyContext = createContext<Currency>("XOF");

/** Devise brute du restaurant courant. */
export function useCurrency(): Currency {
  return useContext(CurrencyContext);
}

/** Retourne une fonction qui formate un montant dans la devise du restaurant. */
export function useMoney(): (amount: number) => string {
  const currency = useContext(CurrencyContext);
  return (amount: number) => formatMoney(amount, currency);
}
