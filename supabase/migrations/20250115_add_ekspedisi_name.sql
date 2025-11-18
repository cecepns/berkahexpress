-- Add ekspedisi_name field to users table for mitra role
ALTER TABLE users 
ADD COLUMN ekspedisi_name VARCHAR(255) NULL AFTER address;

