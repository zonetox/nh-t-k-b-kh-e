const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env file directly if dotenv is not available, but we'll install dotenv to be safe
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  console.log('dotenv not found, ensure variables are in environment');
}

async function runMigration() {
  if (!process.env.DIRECT_URL) {
    console.error("No DIRECT_URL found in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });

  try {
    await client.connect();
    console.log('Successfully connected to production database.');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260324000002_add_missing_and_optional_vaccines.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 20260324000002_add_missing_and_optional_vaccines.sql');
    await client.query(sql);
    
    console.log('Migration successfully applied to production!');
  } catch (error) {
    console.error('Error applying migration:');
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
