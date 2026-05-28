-- Ajouter "geniuspay" comme méthode de paiement valide
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('wave', 'orange_money', 'free_money', 'carte', 'cinetpay', 'geniuspay'));
