-- ================================================================
-- MIGRATION 024 : Raison de suspension + flags email
-- ================================================================

-- Motif de la suspension pour personnaliser le message affiché
-- "trial_expired"  : essai 14j terminé sans abonnement
-- "plan_expired"   : abonnement payant arrivé à expiration
-- "admin"          : suspendu manuellement depuis l'admin
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL;

-- Empêcher l'envoi répété de l'email d'avertissement "J-2"
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS trial_warning_sent BOOLEAN NOT NULL DEFAULT false;

-- Empêcher l'envoi répété de l'email de suspension/expiration
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS expiry_email_sent BOOLEAN NOT NULL DEFAULT false;
