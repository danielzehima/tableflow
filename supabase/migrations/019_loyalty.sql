-- Programme de fidélité clients

-- Colonnes de configuration sur la table restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS loyalty_enabled boolean DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS loyalty_points_per_order integer DEFAULT 1;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS loyalty_threshold integer DEFAULT 10;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS loyalty_reward text DEFAULT 'Réduction de 500 FCFA';

-- Solde de points sur les clients
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;

-- Historique des transactions de points
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_transactions_restaurant_id_idx ON loyalty_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_customer_id_idx ON loyalty_transactions(customer_id);
