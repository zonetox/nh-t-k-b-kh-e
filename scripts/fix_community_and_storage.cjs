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
    console.log('Successfully connected to production database.');

    // 1. Run the Community Schema Migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260325000001_community_schema.sql');
    if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('Running migration: 20260325000001_community_schema.sql');
        await client.query(sql);
        console.log('Community schema migration successfully applied!');
    } else {
        console.error('Migration file not found:', migrationPath);
    }

    // 2. Fix the storage bucket public flag
    console.log('Fixing vaccination-certificates bucket public flag...');
    await client.query(`UPDATE storage.buckets SET public = true WHERE id = 'vaccination-certificates';`);
    console.log('Bucket fix applied successfully!');
    
  } catch (error) {
    console.error('Error applying migration:');
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
