-- ================================================================
-- MIGRATION: Colonne is_demo + restaurant démo "Le Bistro TableFlow"
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Ajouter la colonne is_demo sur la table restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 2. Insérer le restaurant démo (idempotent)
INSERT INTO restaurants (
  name, slug, description, cuisine, phone, address,
  primary_color, welcome_message, is_demo, onboarding_done
)
SELECT
  'Le Bistro TableFlow',
  'demo',
  'Un restaurant méditerranéen chaleureux au cœur de la ville. Cuisine faite maison, produits frais du marché.',
  'Française',
  '+225 07 00 00 00',
  'Abidjan, Plateau',
  '#f97316',
  'Bienvenue ! Commandez directement depuis votre table.',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM restaurants WHERE slug = 'demo'
);

-- 3. Insérer les catégories du menu démo
DO $$
DECLARE
  v_resto_id UUID;
  v_cat_entrees UUID;
  v_cat_plats UUID;
  v_cat_desserts UUID;
  v_cat_boissons UUID;
BEGIN
  SELECT id INTO v_resto_id FROM restaurants WHERE slug = 'demo';

  -- Catégories
  INSERT INTO menu_categories (restaurant_id, name, position)
  VALUES (v_resto_id, 'Entrées', 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_entrees;

  IF v_cat_entrees IS NULL THEN
    SELECT id INTO v_cat_entrees FROM menu_categories WHERE restaurant_id = v_resto_id AND name = 'Entrées';
  END IF;

  INSERT INTO menu_categories (restaurant_id, name, position)
  VALUES (v_resto_id, 'Plats', 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_plats;

  IF v_cat_plats IS NULL THEN
    SELECT id INTO v_cat_plats FROM menu_categories WHERE restaurant_id = v_resto_id AND name = 'Plats';
  END IF;

  INSERT INTO menu_categories (restaurant_id, name, position)
  VALUES (v_resto_id, 'Desserts', 3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_desserts;

  IF v_cat_desserts IS NULL THEN
    SELECT id INTO v_cat_desserts FROM menu_categories WHERE restaurant_id = v_resto_id AND name = 'Desserts';
  END IF;

  INSERT INTO menu_categories (restaurant_id, name, position)
  VALUES (v_resto_id, 'Boissons', 4)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_boissons;

  IF v_cat_boissons IS NULL THEN
    SELECT id INTO v_cat_boissons FROM menu_categories WHERE restaurant_id = v_resto_id AND name = 'Boissons';
  END IF;

  -- Entrées
  INSERT INTO menu_items (category_id, name, description, price, available, position) VALUES
    (v_cat_entrees, 'Salade César',       'Laitue romaine, parmesan, croûtons maison, sauce César',  3500,  true, 1),
    (v_cat_entrees, 'Soupe du jour',      'Soupe de légumes frais, crème fraîche, herbes aromatiques', 2500, true, 2),
    (v_cat_entrees, 'Bruschetta',         'Tomates fraîches, basilic, ail, huile d''olive sur pain grillé', 2800, true, 3)
  ON CONFLICT DO NOTHING;

  -- Plats
  INSERT INTO menu_items (category_id, name, description, price, available, position) VALUES
    (v_cat_plats, 'Poulet Rôti',        'Poulet fermier rôti, pommes de terre grenaille, jus de cuisson', 7500, true, 1),
    (v_cat_plats, 'Steak Frites',       'Entrecôte 250g, frites maison, sauce au poivre',               9500, true, 2),
    (v_cat_plats, 'Pasta Carbonara',    'Spaghetti, lardons fumés, œuf, parmesan, poivre noir',          6500, true, 3),
    (v_cat_plats, 'Poisson du jour',    'Filet de poisson grillé, légumes vapeur, citron',               8500, true, 4)
  ON CONFLICT DO NOTHING;

  -- Desserts
  INSERT INTO menu_items (category_id, name, description, price, available, position) VALUES
    (v_cat_desserts, 'Fondant Chocolat', 'Cœur coulant chocolat noir, glace vanille, coulis caramel',   3500, true, 1),
    (v_cat_desserts, 'Crème Brûlée',     'Crème vanille, caramel croustillant, fruits rouges',          3000, true, 2),
    (v_cat_desserts, 'Tarte Tatin',      'Tarte aux pommes caramélisées, chantilly maison',             3200, true, 3)
  ON CONFLICT DO NOTHING;

  -- Boissons
  INSERT INTO menu_items (category_id, name, description, price, available, position) VALUES
    (v_cat_boissons, 'Eau minérale',     'Eau plate ou pétillante 50cl',                               500,  true, 1),
    (v_cat_boissons, 'Jus d''orange',   'Jus d''orange fraîchement pressé',                           1500, true, 2),
    (v_cat_boissons, 'Coca-Cola',        'Coca-Cola 33cl',                                             1000, true, 3),
    (v_cat_boissons, 'Café',             'Espresso, allongé ou noisette',                              1200, true, 4)
  ON CONFLICT DO NOTHING;

END $$;
