-- PREPARED ONLY. Separate production approval and a fresh physical reconciliation required.
-- Operator must FIRST pause new eight-digit sales and document clearance of every old
-- open/asynchronous session and unsent/paid order. Only then set legacy_sessions_cleared=1.
-- Do not perform that attestation blindly or based on wall-clock expiry alone.
UPDATE inventory_controls SET state='ready',confirmed_at=strftime('%Y-%m-%dT%H:%M:%SZ','now')
WHERE product_id='seedplate' AND state='uninitialized' AND legacy_sessions_cleared=1
 AND EXISTS(SELECT 1 FROM product_inventory WHERE product_id='seedplate' AND stock=0)
 AND NOT EXISTS(SELECT 1 FROM accessory_reservations WHERE product_id='seedplate');
-- User-confirmed snapshot: four physical units. Recount and reconcile before execution.
UPDATE product_inventory SET stock=4
WHERE product_id='seedplate' AND stock=0
 AND EXISTS(SELECT 1 FROM inventory_controls WHERE product_id='seedplate' AND state='ready' AND legacy_sessions_cleared=1)
 AND NOT EXISTS(SELECT 1 FROM accessory_reservations WHERE product_id='seedplate');
SELECT i.product_id,i.stock,c.state,c.legacy_sessions_cleared,c.confirmed_at FROM product_inventory i JOIN inventory_controls c USING(product_id) WHERE i.product_id='seedplate';
