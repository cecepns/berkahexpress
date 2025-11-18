-- Add sender fields to transactions table for manual sender input
ALTER TABLE transactions 
ADD COLUMN sender_name VARCHAR(255) NULL AFTER resi,
ADD COLUMN sender_phone VARCHAR(20) NULL AFTER sender_name,
ADD COLUMN sender_address TEXT NULL AFTER sender_phone;

