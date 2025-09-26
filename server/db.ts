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
    pool = new PgPool({ connectionString: process.env.DATABASE_URL });
    db = drizzlePg(pool, { schema });
  } else {
    // Use Neon serverless for other environments
    console.log(`✅ Initializing Neon PostgreSQL connection`);
    neonConfig.webSocketConstructor = ws;
    pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
    db = drizzleNeon(pool, { schema });
  }
} else if (requiresDatabase) {
  console.error(`❌ DATABASE_URL is required for production deployment`);
  throw new Error(
    "DATABASE_URL must be set for production deployment. Please configure your database connection in Coolify."
  );
} else {
  console.log(`ℹ️  DATABASE_URL not found - this is expected for development with MemStorage`);
}

// Export database instances (may be null in development)
export { pool, db };