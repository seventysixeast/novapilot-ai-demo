const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Try to construct connection string or find one in environment
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@localhost:54322/postgres";

async function main() {
  console.log('Connecting with string:', connectionString.replace(/:[^:@\n]+@/, ':***@')); // redact password
  const client = new Client({ connectionString });
  await client.connect();

  const migrationPath = path.resolve(__dirname, 'migrations/20260526000000_ai_outbound_emails.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration...');
  await client.query(sql);
  console.log('Migration successfully applied!');

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
