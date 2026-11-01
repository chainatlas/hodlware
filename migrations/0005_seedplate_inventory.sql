-- PREPARED ONLY. Additive schema; never initializes the confirmed count automatically.
INSERT OR IGNORE INTO product_inventory(product_id,stock) VALUES('seedplate',0);
CREATE TABLE IF NOT EXISTS inventory_controls (
 product_id TEXT PRIMARY KEY REFERENCES product_inventory(product_id),
 state TEXT NOT NULL DEFAULT 'uninitialized' CHECK(state IN ('uninitialized','ready','review')),
 legacy_sessions_cleared INTEGER NOT NULL DEFAULT 0 CHECK(legacy_sessions_cleared IN (0,1)),
 confirmed_at TEXT
);
INSERT OR IGNORE INTO inventory_controls(product_id) VALUES('seedplate');
CREATE TRIGGER IF NOT EXISTS seedplate_stock_floor BEFORE UPDATE OF stock ON product_inventory
WHEN NEW.product_id='seedplate' AND NEW.stock<COALESCE((SELECT SUM(quantity) FROM accessory_reservations WHERE product_id='seedplate' AND state IN ('held','paid')),0)
BEGIN SELECT RAISE(ABORT,'seedplate stock below commitments'); END;
CREATE TRIGGER IF NOT EXISTS seedplate_reservation_ready BEFORE INSERT ON accessory_reservations
WHEN NEW.product_id='seedplate' AND NOT EXISTS(SELECT 1 FROM inventory_controls WHERE product_id='seedplate' AND state='ready' AND legacy_sessions_cleared=1)
BEGIN SELECT RAISE(ABORT,'seedplate inventory not ready'); END;
