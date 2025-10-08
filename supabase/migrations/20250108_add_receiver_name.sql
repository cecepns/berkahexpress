-- Add receiver_name field to transactions table

ALTER TABLE transactions
ADD COLUMN receiver_name VARCHAR(255) AFTER destination;

-- Update the column order to be: destination, receiver_name, receiver_phone, receiver_address
-- This makes the receiver information grouped together logically

