CREATE TABLE IF NOT EXISTS checkout_orders (session_id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK(state IN ('pending','paid','expired','failed')), updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkout_events (event_id TEXT PRIMARY KEY, session_id TEXT NOT NULL);
