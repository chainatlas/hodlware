-- Apply only after approval, before enabling the second product.
-- 24 saleable units confirmed by the operator on 2026-10-27.
CREATE TABLE IF NOT EXISTS product_inventory (
 product_id TEXT PRIMARY KEY,
 stock INTEGER NOT NULL CHECK(stock>=0)
);
INSERT OR IGNORE INTO product_inventory(product_id,stock) VALUES('recoveryplate4',24);
CREATE TABLE IF NOT EXISTS stock_reservations (
 reservation_id TEXT PRIMARY KEY,
 product_id TEXT NOT NULL REFERENCES product_inventory(product_id),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 session_id TEXT UNIQUE,
 state TEXT NOT NULL DEFAULT 'held' CHECK(state IN ('held','paid','released')),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stock_reserved ON stock_reservations(product_id,state);
CREATE TABLE IF NOT EXISTS checkout_order_items (
 session_id TEXT NOT NULL REFERENCES checkout_orders(session_id),
 product_id TEXT NOT NULL,
 name TEXT NOT NULL,
 unit_price INTEGER NOT NULL CHECK(unit_price>0),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 currency TEXT NOT NULL DEFAULT 'eur',
 PRIMARY KEY(session_id,product_id)
);

-- Reject inconsistent concurrent or late transitions instead of overselling.
CREATE TRIGGER IF NOT EXISTS reservation_paid_after_release BEFORE UPDATE ON stock_reservations
WHEN OLD.state='released' AND NEW.state='paid'
BEGIN SELECT RAISE(ABORT,'reservation requires review'); END;
CREATE TRIGGER IF NOT EXISTS reservation_session_immutable BEFORE UPDATE ON stock_reservations
WHEN OLD.session_id IS NOT NULL AND NEW.session_id<>OLD.session_id
BEGIN SELECT RAISE(ABORT,'reservation session mismatch'); END;
