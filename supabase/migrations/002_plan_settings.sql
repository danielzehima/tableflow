-- ================================================================
-- MIGRATION: Paramètres des plans tarifaires
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS plan_settings (
  plan        TEXT PRIMARY KEY CHECK (plan IN ('free', 'starter', 'pro')),
  label       TEXT NOT NULL DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'FCFA',
  description TEXT NOT NULL DEFAULT '',
  features    JSONB NOT NULL DEFAULT '[]',
  highlight   BOOLEAN NOT NULL DEFAULT false,
  badge       TEXT,
  cta_text    TEXT NOT NULL DEFAULT 'Commencer',
  cta_href    TEXT NOT NULL DEFAULT '/inscription',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plan_settings (plan, label, price, currency, description, features, highlight, badge, cta_text, cta_href, sort_order) VALUES
(
  'free', 'Gratuit', 0, 'FCFA',
  'Pour découvrir TableFlow sans engagement',
  '["Page publique", "Menu en ligne", "5 réservations / mois"]',
  false, null, 'Commencer gratuitement', '/inscription', 0
),
(
  'starter', 'Starter', 9900, 'FCFA',
  'Pour démarrer votre présence en ligne',
  '["Tout Gratuit", "Réservations illimitées", "Commandes en ligne", "Stats basiques", "Support par email"]',
  false, null, 'Commencer', '/inscription', 1
),
(
  'pro', 'Pro', 24900, 'FCFA',
  'La solution complète pour les restaurants actifs',
  '["Tout Starter", "Bannière personnalisée", "Support prioritaire", "Stats avancées", "Notifications SMS / email"]',
  true, 'Le plus populaire', 'Démarrer l''essai gratuit', '/inscription', 2
)
ON CONFLICT (plan) DO NOTHING;
