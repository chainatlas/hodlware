CREATE TABLE IF NOT EXISTS submissions (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, fingerprint TEXT NOT NULL,
 payload TEXT NOT NULL, received_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mail_outbox (
 id TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending'
 CHECK(state IN ('pending','sending','sent','review')), created_at INTEGER NOT NULL,
 first_attempt INTEGER, next_attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
 attempts INTEGER NOT NULL DEFAULT 0, provider_id TEXT
);
CREATE INDEX IF NOT EXISTS mail_due ON mail_outbox(state,next_attempt,lease_until);
CREATE TABLE IF NOT EXISTS form_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS order_confirmations (session_id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, snapshot TEXT NOT NULL, created_at TEXT NOT NULL);
