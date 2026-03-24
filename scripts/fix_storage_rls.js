const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected to database...");
  
  await client.query(`
    -- Create bucket if not exists
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('vaccination-certificates', 'vaccination-certificates', true)
    ON CONFLICT (id) DO NOTHING;

    -- Drop existing to recreate
    DROP POLICY IF EXISTS "Public certificates are viewable by everyone." ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their certificates." ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their certificates." ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their certificates." ON storage.objects;

    -- Create permissive policies for authenticated users
    CREATE POLICY "Public certificates are viewable by everyone."
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'vaccination-certificates' );

    CREATE POLICY "Users can upload their certificates."
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'vaccination-certificates' AND auth.role() = 'authenticated' );

    CREATE POLICY "Users can update their certificates."
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'vaccination-certificates' AND auth.role() = 'authenticated' );

    CREATE POLICY "Users can delete their certificates."
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'vaccination-certificates' AND auth.role() = 'authenticated' );
  `);
  
  console.log("Storage bucket and RLS policies successfully created/updated!");
  await client.end();
}

main().catch(err => {
  console.error("Failed to run script:", err);
  process.exit(1);
});
