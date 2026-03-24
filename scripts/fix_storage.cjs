const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {}

async function runMigration() {
  if (!process.env.DIRECT_URL) {
    console.error("No DIRECT_URL in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DIRECT_URL });

  try {
    await client.connect();
    console.log('Connected to production DB.');

    const sql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20260324000003_fix_certificate_storage.sql'),
      'utf8'
    );

    console.log('Running: 20260324000003_fix_certificate_storage.sql');
    await client.query(sql);
    console.log('Storage migration applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
