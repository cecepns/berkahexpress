-- Add is_manual_tracking column to transactions table
-- This allows admin to manually input tracking updates instead of using expedition API

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_manual_tracking BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on is_manual_tracking
CREATE INDEX IF NOT EXISTS idx_transactions_is_manual_tracking ON transactions(is_manual_tracking);
