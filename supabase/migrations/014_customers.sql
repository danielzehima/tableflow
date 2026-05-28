-- Table clients collectés via commandes
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Client',
  phone         TEXT NOT NULL,
  order_count   INTEGER NOT NULL DEFAULT 1,
  last_order_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, phone)
);

CREATE INDEX IF NOT EXISTS customers_restaurant_idx ON customers(restaurant_id, last_order_at DESC);

-- Ajouter nom/téléphone client dans les commandes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
