import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("nktiemchung-backup"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function encryptData(data: string, secret: string): Promise<Uint8Array> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("BACKUP_ENCRYPTION_KEY");
    
    if (!encryptionKey) {
      throw new Error("BACKUP_ENCRYPTION_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Exclude static/rarely-changed tables (vaccines, vaccine_dose_rules)
    const tables = [
      "profiles", "babies", "vaccine_schedules",
      "vaccine_history", "payments",
      "subscriptions", "notifications",
    ];

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const errors: string[] = [];
    const uploaded: string[] = [];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").limit(10000);
      if (error) {
        errors.push(`${table}: ${error.message}`);
        continue;
      }

      const jsonStr = JSON.stringify({
        table,
        created_at: now.toISOString(),
        row_count: data?.length || 0,
        rows: data || [],
      });

      const encrypted = await encryptData(jsonStr, encryptionKey);
      const fileName = `daily/backup-${dateStr}-${table}.enc`;

      const { error: uploadError } = await supabase.storage
        .from("system-backups")
        .upload(fileName, encrypted, {
          contentType: "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        errors.push(`upload ${table}: ${uploadError.message}`);
      } else {
        uploaded.push(fileName);
      }
    }

    // Cleanup: delete daily backups older than 30 days
    const { data: files } = await supabase.storage.from("system-backups").list("daily");
    if (files) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const oldFiles = files.filter((f) => {
        const match = f.name.match(/backup-(\d{4}-\d{2}-\d{2})-/);
        return match && new Date(match[1]) < cutoff;
      });
      if (oldFiles.length > 0) {
        await supabase.storage
          .from("system-backups")
          .remove(oldFiles.map((f) => `daily/${f.name}`));
      }
    }

    // Run integrity check
    const { data: integrityResult } = await supabase.rpc("check_data_integrity");

    return new Response(
      JSON.stringify({
        success: true,
        files_uploaded: uploaded.length,
        uploaded,
        errors,
        integrity: integrityResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
