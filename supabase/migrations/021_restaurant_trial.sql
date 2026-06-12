-- ================================================================
-- MIGRATION 021 : Champ created_at garanti sur restaurants
-- + valeurs par défaut plan/status pour anciens enregistrements
-- ================================================================

-- S'assurer que created_at existe (Supabase l'ajoute par défaut mais on garantit)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- S'assurer que plan et status existent avec des valeurs par défaut
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan       TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Mettre à jour les restaurants existants sans plan
UPDATE restaurants SET plan = 'free'   WHERE plan IS NULL OR plan = '';
UPDATE restaurants SET status = 'active' WHERE status IS NULL OR status = '';

-- Index pour accélérer les requêtes de vérification de plan
CREATE INDEX IF NOT EXISTS restaurants_plan_status_idx
  ON restaurants(plan, status);

-- ================================================================
-- NOTE : Le calcul de la période d'essai (14 jours) se fait
-- côté application dans app/lib/plan-utils.ts via created_at.
-- Aucune colonne trial_ends_at n'est nécessaire car created_at
-- est la source de vérité et ne peut pas être falsifiée.
-- ================================================================
