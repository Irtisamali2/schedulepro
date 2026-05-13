/**
 * Run this script on the server to reset a team member's password.
 * Usage: node reset-team-password.mjs
 *
 * Requires DATABASE_URL to be set in .env
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

// Load .env manually
try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  }
} catch {}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL not set');
  process.exit(1);
}

// ── credentials to fix ──────────────────────────────────────────────────────
const TARGET_EMAIL = 'testteam@mail.com';
const NEW_PASSWORD  = 'Awais@2023';
// ────────────────────────────────────────────────────────────────────────────

const { default: pg } = await import('pg');
const { default: bcrypt } = await import('bcrypt');

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Check if the member exists
const { rows } = await client.query(
  'SELECT id, name, email, password FROM team_members WHERE email = $1',
  [TARGET_EMAIL]
);

if (rows.length === 0) {
  console.error(`❌  No team member found with email: ${TARGET_EMAIL}`);
  await client.end();
  process.exit(1);
}

const member = rows[0];
console.log(`✅ Found: ${member.name} (${member.email})`);
console.log(`   Current password hash: ${member.password ? member.password.substring(0, 20) + '...' : '(empty)'}`);

const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

await client.query(
  'UPDATE team_members SET password = $1, updated_at = NOW() WHERE id = $2',
  [hashed, member.id]
);

console.log('✅ Password updated successfully.');
console.log(`   Email   : ${TARGET_EMAIL}`);
console.log(`   Password: ${NEW_PASSWORD}`);

await client.end();
