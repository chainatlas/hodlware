-- PREPARED ONLY: requires explicit approval before any production execution.
-- Zero saleable stock until a physical count is confirmed. Never seed 2000.
INSERT OR IGNORE INTO product_inventory(product_id,stock) VALUES('void-stickers',0);
CREATE TABLE IF NOT EXISTS accessory_reservations (
 reservation_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES product_inventory(product_id),
 quantity INTEGER NOT NULL CHECK(quantity>0), created_at INTEGER NOT NULL,
 session_id TEXT, state TEXT NOT NULL DEFAULT 'held' CHECK(state IN ('held','paid','released')),
 plate_quantity INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(reservation_id,product_id)
);
CREATE INDEX IF NOT EXISTS accessory_reserved ON accessory_reservations(product_id,state);
CREATE TRIGGER IF NOT EXISTS accessory_capacity BEFORE INSERT ON accessory_reservations
WHEN NOT EXISTS(SELECT 1 FROM accessory_reservations WHERE reservation_id=NEW.reservation_id AND product_id=NEW.product_id)
BEGIN
 SELECT CASE WHEN COALESCE((SELECT stock FROM product_inventory WHERE product_id=NEW.product_id),0)-COALESCE((SELECT SUM(quantity) FROM accessory_reservations WHERE product_id=NEW.product_id AND state IN ('held','paid')),0)<NEW.quantity THEN RAISE(ABORT,'stock') END;
 SELECT CASE WHEN NEW.plate_quantity>0 AND NOT EXISTS(SELECT 1 FROM stock_reservations WHERE reservation_id=NEW.reservation_id AND quantity=NEW.plate_quantity AND state='held') THEN RAISE(ABORT,'plate stock') END;
END;
CREATE TRIGGER IF NOT EXISTS accessory_transition BEFORE UPDATE ON accessory_reservations
WHEN (OLD.state='released' AND NEW.state='paid') OR (OLD.session_id IS NOT NULL AND NEW.session_id<>OLD.session_id)
BEGIN SELECT RAISE(ABORT,'reservation requires review'); END;
