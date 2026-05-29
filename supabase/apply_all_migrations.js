const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const password = 'F45AxqiD3Wjoh1mo';
const connectionString = `postgresql://postgres:${password}@db.zzbgeukmsifkfmngrjxj.supabase.co:6543/postgres`;

async function main() {
  console.log('Connecting to new Supabase database...');
  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected successfully!');

  // Reset public schema to have a clean database
  console.log('Cleaning public schema...');
  await client.query(`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);
  console.log('✅ Schema cleaned.');

  // Read migrations in order
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await client.query(sql);
        console.log(`✅ Applied ${file}`);
      } catch (err) {
        console.error(`❌ Failed to apply ${file}:`, err.message);
        throw err;
      }
    }
  }

  // Apply seed.sql
  console.log('Applying seed.sql...');
  const seedSql = fs.readFileSync(path.resolve(__dirname, 'seed.sql'), 'utf8');
  try {
    await client.query(seedSql);
    console.log('✅ Applied seed.sql successfully!');
  } catch (err) {
    console.error('❌ Failed to apply seed.sql:', err.message);
    throw err;
  }

  await client.end();
  console.log('\n🎉 ALL MIGRATIONS AND SEED DATA APPLIED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
