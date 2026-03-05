import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Environment detection
const isReplit = !!process.env.REPL_ID;
const isCoolify = process.env.DEPLOY_TARGET === 'coolify';
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

// Log environment info
console.log(`🔧 Database Environment Detection:`);
console.log(`  - Replit: ${isReplit ? 'Yes' : 'No'}`);
console.log(`  - Coolify: ${isCoolify ? 'Yes' : 'No'}`);
console.log(`  - Production: ${isProduction ? 'Yes' : 'No'}`);
console.log(`  - DATABASE_URL present: ${hasDatabaseUrl ? 'Yes' : 'No'}`);

// Conditional database connection
let pool: any = null;
let db: any = null;

// Only require DATABASE_URL for production environments that need it
const requiresDatabase = (isCoolify || isProduction) && !isReplit;

if (hasDatabaseUrl) {
  if (isCoolify) {
    // Use regular PostgreSQL for Coolify
    console.log(`✅ Initializing Coolify PostgreSQL connection`);
    pool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    });

    // Add error handling for pool
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    db = drizzlePg(pool, { schema });
  } else {
    // Use Neon serverless for other environments (like Supabase)
    console.log(`✅ Initializing Neon PostgreSQL connection`);
    neonConfig.webSocketConstructor = ws;
    neonConfig.fetchConnectionCache = true; // Enable connection caching

    pool = new NeonPool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Add error handling for Neon pool
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle Neon client', err);
    });

    db = drizzleNeon(pool, { schema });
  }

  // Test the connection
  (async () => {
    try {
      const client = await pool.connect();
      console.log('✅ Database connection test successful');
      client.release();
    } catch (err) {
      console.error('❌ Database connection test failed:', err);
    }
  })();
} else if (requiresDatabase) {
  console.error(`❌ DATABASE_URL is required for production deployment`);
  throw new Error(
    "DATABASE_URL must be set for production deployment. Please configure your database connection in Coolify."
  );
} else {
  console.log(`ℹ️  DATABASE_URL not found - this is expected for development with MemStorage`);
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database connections...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database connections...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Handle unhandled promise rejections to prevent server crashes
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't crash the server, just log the error
});

// Handle uncaught exceptions to prevent server crashes
process.on('uncaughtException', (error: Error) => {
  console.error('⚠️  Uncaught Exception:', error);
  // Don't crash the server, just log the error
  // In production, you might want to restart the server after logging
});

// Export database instances (may be null in development)
export { pool, db };