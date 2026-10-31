-- PREPARED ONLY. Execute against production only after separate explicit approval.
-- Requires migrations/0004_accessory_inventory.sql. Does NOT enable sales.
-- Confirmed allocation: 1800 saleable physical stickers + 200 excluded reserve.
-- All package variants use product_inventory.product_id = 'void-stickers'.
-- Initialize only the pristine zero-stock row. Never reset live stock or history.
UPDATE product_inventory
SET stock = 1800
WHERE product_id = 'void-stickers'
  AND stock = 0
  AND NOT EXISTS (
    SELECT 1 FROM accessory_reservations WHERE product_id = 'void-stickers'
  );
-- Operator must inspect the result; a non-pristine inventory is left untouched.
SELECT product_id, stock FROM product_inventory WHERE product_id = 'void-stickers';
