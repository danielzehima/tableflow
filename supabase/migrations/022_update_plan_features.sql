-- ================================================================
-- MIGRATION 022 : Mise à jour des fonctionnalités des plans tarifaires
-- Synchronisé avec l'implémentation réelle (plan-utils.ts)
-- ================================================================

INSERT INTO plan_settings (plan, label, price, currency, description, features, highlight, badge, cta_text, cta_href, sort_order)
VALUES
(
  'free',
  'Gratuit',
  0,
  'FCFA',
  'Testez TableFlow sans engagement, 14 jours en accès complet',
  '[
    "14 jours d''essai gratuit — accès complet",
    "Page publique du restaurant",
    "Menu en ligne avec photos",
    "5 réservations / mois",
    "QR code de table basique"
  ]'::jsonb,
  false,
  null,
  'Commencer gratuitement',
  '/inscription',
  0
),
(
  'starter',
  'Starter',
  9900,
  'FCFA',
  'Tout ce qu''il faut pour digitaliser votre restaurant',
  '[
    "Tout du plan Gratuit",
    "Réservations illimitées",
    "Commandes en ligne",
    "Tables & QR codes illimités",
    "Heures creuses & réductions auto",
    "Codes promo",
    "Avis clients & note publique",
    "Analytics & statistiques",
    "Messagerie visiteurs en temps réel",
    "Événements & agenda",
    "Personnalisation (couleurs, logo)",
    "Support par email"
  ]'::jsonb,
  false,
  null,
  'Démarrer l''essai gratuit',
  '/inscription',
  1
),
(
  'pro',
  'Pro',
  24900,
  'FCFA',
  'La solution complète pour les restaurants ambitieux',
  '[
    "Tout du plan Starter",
    "Programme de fidélité clients",
    "Newsletter & campagnes email",
    "Gestion d''équipe multi-rôles",
    "Accès serveur & cuisinier dédié",
    "Support prioritaire"
  ]'::jsonb,
  true,
  'Le plus populaire',
  'Démarrer l''essai gratuit',
  '/inscription',
  2
)
ON CONFLICT (plan) DO UPDATE SET
  label       = EXCLUDED.label,
  price       = EXCLUDED.price,
  currency    = EXCLUDED.currency,
  description = EXCLUDED.description,
  features    = EXCLUDED.features,
  highlight   = EXCLUDED.highlight,
  badge       = EXCLUDED.badge,
  cta_text    = EXCLUDED.cta_text,
  cta_href    = EXCLUDED.cta_href,
  sort_order  = EXCLUDED.sort_order,
  updated_at  = now();
