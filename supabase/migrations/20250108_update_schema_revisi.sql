-- Migration untuk revisi sistem
-- 1. Tambah role mitra di users
-- 2. Tambah kategori dan harga mitra di prices
-- 3. Buat tabel expeditions
-- 4. Update tabel transactions untuk ekspedisi dan field tambahan
-- 5. Tambah is_identity flag di prices

-- ==================== UPDATE USERS TABLE ====================
-- Ubah enum role untuk menambahkan 'mitra'
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'customer', 'mitra') DEFAULT 'customer';

-- ==================== CREATE EXPEDITIONS TABLE ====================
CREATE TABLE IF NOT EXISTS expeditions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  api_url VARCHAR(500),
  api_key VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== UPDATE PRICES TABLE ====================
-- Tambah kategori, harga mitra, dan is_identity flag
ALTER TABLE prices 
ADD COLUMN category ENUM('REGULER', 'SENSITIF', 'BATERAI') DEFAULT 'REGULER' AFTER country,
ADD COLUMN price_per_kg_mitra DECIMAL(10,2) AFTER price_per_kg,
ADD COLUMN price_per_volume_mitra DECIMAL(10,2) AFTER price_per_volume,
ADD COLUMN is_identity BOOLEAN DEFAULT FALSE AFTER price_per_volume_mitra;

-- Update unique constraint untuk include kategori
-- Drop old constraint jika ada
ALTER TABLE prices DROP INDEX IF EXISTS unique_country;

-- Tambah unique constraint untuk country + category
ALTER TABLE prices ADD UNIQUE KEY unique_country_category (country, category);

-- ==================== UPDATE TRANSACTIONS TABLE ====================
-- Tambah field untuk ekspedisi
ALTER TABLE transactions
ADD COLUMN expedition_id INT AFTER user_id,
ADD COLUMN expedition_resi VARCHAR(255) AFTER expedition_id;

-- Tambah field untuk receiver info
ALTER TABLE transactions
ADD COLUMN receiver_phone VARCHAR(20) AFTER destination,
ADD COLUMN receiver_address TEXT AFTER receiver_phone;

-- Tambah field untuk kategori barang
ALTER TABLE transactions
ADD COLUMN item_category ENUM('REGULER', 'SENSITIF', 'BATERAI') DEFAULT 'REGULER' AFTER receiver_address;

-- Tambah field untuk identity requirements
ALTER TABLE transactions
ADD COLUMN foto_alamat VARCHAR(255) AFTER item_category,
ADD COLUMN kode_pos_penerima VARCHAR(10) AFTER foto_alamat,
ADD COLUMN tanda_pengenal_depan VARCHAR(255) AFTER kode_pos_penerima,
ADD COLUMN tanda_pengenal_belakang VARCHAR(255) AFTER tanda_pengenal_depan,
ADD COLUMN nomor_identitas_penerima VARCHAR(100) AFTER tanda_pengenal_belakang,
ADD COLUMN email_penerima VARCHAR(255) AFTER nomor_identitas_penerima;

-- Tambah foreign key untuk expedition
ALTER TABLE transactions
ADD CONSTRAINT fk_expedition
FOREIGN KEY (expedition_id) REFERENCES expeditions(id)
ON DELETE SET NULL;

-- ==================== INSERT DEFAULT EXPEDITIONS ====================
INSERT INTO expeditions (name, code, is_active) VALUES
('JNE', 'JNE', TRUE),
('DHL', 'DHL', TRUE),
('FedEx', 'FEDEX', TRUE),
('UPS', 'UPS', TRUE),
('Singapore Post', 'SINGPOST', TRUE);

-- ==================== UPDATE EXISTING PRICES ====================
-- Tambah harga mitra default (sama dengan harga customer untuk existing data)
UPDATE prices 
SET price_per_kg_mitra = price_per_kg,
    price_per_volume_mitra = price_per_volume
WHERE price_per_kg_mitra IS NULL;

