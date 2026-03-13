import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const tables = [
      "profiles",
      "babies",
      "vaccine_schedules",
      "vaccines",
      "vaccine_dose_rules",
      "vaccine_history",
      "payments",
      "subscriptions",
      "notifications",
    ];

    const backup: Record<string, unknown[]> = {};
    const errors: string[] = [];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        errors.push(`${table}: ${error.message}`);
      } else {
        backup[table] = data || [];
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `backup-${dateStr}.json`;

    const backupData = JSON.stringify({
      created_at: now.toISOString(),
      tables: backup,
      errors: errors.length > 0 ? errors : undefined,
    });

    const { error: uploadError } = await supabase.storage
      .from("system-backups")
      .upload(`daily/${fileName}`, new Blob([backupData], { type: "application/json" }), {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Cleanup: delete daily backups older than 30 days
    const { data: files } = await supabase.storage.from("system-backups").list("daily");
    if (files) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const oldFiles = files.filter((f) => {
        const match = f.name.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
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
        backup_file: `daily/${fileName}`,
        tables_backed_up: Object.keys(backup).length,
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
