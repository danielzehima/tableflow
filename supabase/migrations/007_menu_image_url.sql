-- Ajoute la colonne image_url sur menu_items pour les photos de plats
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
