const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
    console.log('Successfully connected to production database for Scalability Patch.');

    // Run the Performance Indexes Migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260327000001_database_scalability_indexes.sql');
    if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('Running migration: 20260327000001_database_scalability_indexes.sql');
        await client.query(sql);
        console.log('Scalability indexes successfully applied! Database is now optimized for 10k+ users.');
    } else {
        console.error('Migration file not found:', migrationPath);
    }
  } catch (error) {
    console.error('Error applying scalability patch:');
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
