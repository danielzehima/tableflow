-- Heures creuses : réductions automatiques programmées par plage horaire

CREATE TABLE IF NOT EXISTS off_peak_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  discount_percent int NOT NULL CHECK (discount_percent BETWEEN 1 AND 80),
  days_of_week int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS off_peak_hours_restaurant_id_idx ON off_peak_hours(restaurant_id);
