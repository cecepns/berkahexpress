-- Migration: Add Price Tiers for Tiered Pricing
-- Date: 2025-01-10
-- Description: Creates price_tiers table to support multiple pricing based on weight/volume ranges

-- Create price_tiers table
CREATE TABLE IF NOT EXISTS price_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  price_id INT NOT NULL,
  min_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_weight DECIMAL(10,2) DEFAULT NULL, -- NULL means unlimited
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_per_volume DECIMAL(10,2) NOT NULL,
  price_per_kg_mitra DECIMAL(10,2) NOT NULL,
  price_per_volume_mitra DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (price_id) REFERENCES prices(id) ON DELETE CASCADE,
  INDEX idx_price_id (price_id),
  INDEX idx_weight_range (min_weight, max_weight)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add use_tiered_pricing flag to prices table
ALTER TABLE prices 
ADD COLUMN use_tiered_pricing BOOLEAN DEFAULT FALSE AFTER is_identity;

-- Add comment for documentation
ALTER TABLE price_tiers 
COMMENT = 'Stores tiered pricing based on weight/volume ranges';

-- Example data comment:
-- For tiered pricing like:
-- 1 Kg: Rp 210.000/Kg
-- 2 Kg - 5 Kg: Rp 160.000/Kg
-- 6 Kg - 10 Kg: Rp 150.000/Kg
-- 11 Kg+: Rp 140.000/Kg
--
-- Would be stored as:
-- INSERT INTO price_tiers (price_id, min_weight, max_weight, price_per_kg, ...) VALUES
-- (1, 0, 1.99, 210000, ...),
-- (1, 2, 5.99, 160000, ...),
-- (1, 6, 10.99, 150000, ...),
-- (1, 11, NULL, 140000, ...);

