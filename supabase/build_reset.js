const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const seedFile = path.join(__dirname, 'seed.sql');
const outputFile = path.join(__dirname, 'full_reset.sql');

const files = fs.readdirSync(migrationsDir).sort();

let fullSql = `
-- ==========================================
-- DANGER: FULL DATABASE RESET SCRIPT
-- ==========================================
-- This script drops all tables and types in the public schema and recreates them.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Clean up auth.users for demo users so the trigger fires cleanly on insert
DELETE FROM auth.users WHERE email LIKE '%@novapilot.ai';

`;

for (const file of files) {
  if (file.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    fullSql += `\n-- MIGRATION: ${file}\n`;
    fullSql += content;
  }
}

const seedContent = fs.readFileSync(seedFile, 'utf-8');
fullSql += `\n-- SEED DATA\n`;
fullSql += seedContent;

fs.writeFileSync(outputFile, fullSql);
console.log('Created full_reset.sql');
