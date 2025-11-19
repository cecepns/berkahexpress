-- Add isi_paket column to transactions table
ALTER TABLE transactions ADD COLUMN isi_paket VARCHAR(255) NOT NULL DEFAULT 'Paket' AFTER item_category;

