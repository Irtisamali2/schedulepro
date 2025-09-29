const { Pool } = require('pg');

async function fixDatabaseSchema() {
  let pool;
  try {
    console.log('🔧 Setting up database connection...');
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL environment variable is not set');
      return;
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('🔧 Adding missing columns to client_services table...');
    
    // Add missing columns to client_services table
    const alterQueries = [
      'ALTER TABLE client_services ADD COLUMN IF NOT EXISTS stripe_product_id text;',
      'ALTER TABLE client_services ADD COLUMN IF NOT EXISTS stripe_price_id text;',
      'ALTER TABLE client_services ADD COLUMN IF NOT EXISTS enable_online_payments boolean DEFAULT false;'
    ];

    for (const query of alterQueries) {
      console.log(`Executing: ${query}`);
      await pool.query(query);
      console.log('✅ Success');
    }

    console.log('🎉 Database schema updated successfully!');
    
    // Verify the columns were added
    console.log('🔍 Verifying columns...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'client_services' 
      AND column_name IN ('stripe_product_id', 'stripe_price_id', 'enable_online_payments')
      ORDER BY column_name;
    `);
    
    console.log('Added columns:', result.rows);
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

fixDatabaseSchema();