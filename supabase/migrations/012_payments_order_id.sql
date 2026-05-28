-- Ajouter la référence commande dans payments (pour les paiements de commandes clients)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
