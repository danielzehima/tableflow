-- Événements restaurant : soirées, brunchs, etc.

CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  event_date      date NOT NULL,
  event_time      time NOT NULL,
  image_url       text,
  max_guests      int,
  price           int NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_restaurant_id_idx ON events(restaurant_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);

-- Réservations pour les événements
CREATE TABLE IF NOT EXISTS event_reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  restaurant_id   uuid NOT NULL,
  customer_name   text NOT NULL,
  customer_phone  text NOT NULL,
  customer_email  text,
  guests_count    int NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed', 'cancelled')),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_reservations_event_id_idx ON event_reservations(event_id);
CREATE INDEX IF NOT EXISTS event_reservations_restaurant_id_idx ON event_reservations(restaurant_id);
