
-- MIGRATION: Ajouter l'email client aux réservations
-- À exécuter dans : Supabase Dashboard → SQL Editor

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS customer_email TEXT;
