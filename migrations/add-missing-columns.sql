-- Migration to add missing columns to existing tables
-- Run this script in your production database to fix column missing errors

-- Add missing columns to client_services table
ALTER TABLE client_services ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE client_services ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE client_services ADD COLUMN IF NOT EXISTS enable_online_payments boolean DEFAULT false;

-- Update any NULL values in enable_online_payments to false
UPDATE client_services SET enable_online_payments = false WHERE enable_online_payments IS NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_services' 
    AND column_name IN ('stripe_product_id', 'stripe_price_id', 'enable_online_payments')
ORDER BY column_name;