-- Migration: Simplify video_carousel_items table
-- Purpose: Remove data redundancy by eliminating manually-entered product data
-- Changes:
--   - Remove: title, price, thumbnail_url (fetch from products table instead)
--   - Remove: link_type, linked_collection_id, external_url (product-only linking)
--   - Make: linked_product_id NOT NULL (required field)

-- Step 1: Create backup table for safety
CREATE TABLE IF NOT EXISTS video_carousel_items_backup AS
SELECT * FROM video_carousel_items;

-- Step 2: Add new required column (nullable temporarily for migration)
ALTER TABLE video_carousel_items
ADD COLUMN IF NOT EXISTS new_linked_product_id UUID
REFERENCES products(id) ON DELETE CASCADE;

-- Step 3: Migrate existing product-linked items
UPDATE video_carousel_items
SET new_linked_product_id = linked_product_id
WHERE link_type = 'product' AND linked_product_id IS NOT NULL;

-- Step 4: Delete items not linked to products (collection/external/none links)
-- These will be lost as they don't fit the simplified model
DELETE FROM video_carousel_items
WHERE link_type != 'product' OR linked_product_id IS NULL;

-- Step 5: Drop redundant columns
ALTER TABLE video_carousel_items
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS link_type,
DROP COLUMN IF EXISTS linked_product_id,
DROP COLUMN IF EXISTS linked_collection_id,
DROP COLUMN IF EXISTS external_url;

-- Step 6: Rename new column and make it required
ALTER TABLE video_carousel_items
RENAME COLUMN new_linked_product_id TO linked_product_id;

ALTER TABLE video_carousel_items
ALTER COLUMN linked_product_id SET NOT NULL;

-- Step 7: Create index for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_video_carousel_items_product_id
ON video_carousel_items(linked_product_id);

-- Step 8: Drop enum type (no longer needed)
DROP TYPE IF EXISTS video_carousel_link_type;

-- Migration complete!
-- Summary:
--   - Removed 6 redundant columns (title, price, thumbnail_url, link_type, linked_collection_id, external_url)
--   - Made linked_product_id required (NOT NULL)
--   - Items with non-product links have been deleted
--   - Backup available in: video_carousel_items_backup
