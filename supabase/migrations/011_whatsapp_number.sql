-- Migration : ajout du numéro WhatsApp sur la table restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '';
