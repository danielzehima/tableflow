-- ================================================================
-- MIGRATION 030 : Prix décimaux (devise native par restaurant)
-- Les restaurants € / $ ont besoin des centimes (ex : 12,50 €).
-- On passe les colonnes monétaires en numeric(12,2).
-- Les valeurs FCFA existantes deviennent X.00 (inchangées à l'affichage).
-- ================================================================

-- Plats du menu
ALTER TABLE menu_items
  ALTER COLUMN price TYPE numeric(12,2) USING price::numeric;

-- Événements
ALTER TABLE events
  ALTER COLUMN price TYPE numeric(12,2) USING price::numeric;

-- Codes promo (montant fixe + commande minimum)
ALTER TABLE promo_codes
  ALTER COLUMN value     TYPE numeric(12,2) USING value::numeric,
  ALTER COLUMN min_order TYPE numeric(12,2) USING min_order::numeric;

-- Commandes (total + remise)
ALTER TABLE orders
  ALTER COLUMN total           TYPE numeric(12,2) USING total::numeric,
  ALTER COLUMN discount_amount TYPE numeric(12,2) USING discount_amount::numeric;

-- Paiements
ALTER TABLE payments
  ALTER COLUMN amount TYPE numeric(12,2) USING amount::numeric;
