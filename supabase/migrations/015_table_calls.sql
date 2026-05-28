CREATE TABLE IF NOT EXISTS table_calls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number  TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('waiter', 'bill')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS table_calls_restaurant_idx ON table_calls(restaurant_id, created_at DESC);
