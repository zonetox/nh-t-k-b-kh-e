import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MarkAsDoneRequest {
  schedule_id: string;
  injected_date: string;
  batch_number?: string;
  location?: string;
  notes?: string;
  image_urls?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MarkAsDoneRequest = await req.json();
    const { schedule_id, injected_date, batch_number, location, notes, image_urls } = body;

    if (!schedule_id || !injected_date) {
      return new Response(
        JSON.stringify({ error: "schedule_id and injected_date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify ownership: check if schedule belongs to user's baby
    const { data: schedule, error: scheduleError } = await supabase
      .from("vaccine_schedules")
      .select(`
        id,
        status,
        babies!inner (
          id,
          user_id
        )
      `)
      .eq("id", schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return new Response(
        JSON.stringify({ error: "Schedule not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((schedule.babies as any).user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (schedule.status === "done") {
      return new Response(
        JSON.stringify({ error: "Schedule already marked as done" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transaction: Insert history + update schedule
    // Step 1: Insert vaccine history
    const { data: historyData, error: historyError } = await supabase
      .from("vaccine_history")
      .insert({
        schedule_id,
        injected_date,
        batch_number: batch_number || null,
        location: location || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (historyError) {
      // Check if it's a unique constraint violation
      if (historyError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "History already exists for this schedule" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw historyError;
    }

    // Step 2: Insert images if provided
    if (image_urls && image_urls.length > 0) {
      const imageInserts = image_urls.map((url) => ({
        history_id: historyData.id,
        image_url: url,
      }));

      const { error: imageError } = await supabase
        .from("vaccine_history_images")
        .insert(imageInserts);

      if (imageError) {
        // Rollback: delete history
        await supabase.from("vaccine_history").delete().eq("id", historyData.id);
        throw imageError;
      }
    }

    // Step 3: Update schedule status
    const { error: updateError } = await supabase
      .from("vaccine_schedules")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", schedule_id);

    if (updateError) {
      // Rollback: delete images and history
      await supabase.from("vaccine_history_images").delete().eq("history_id", historyData.id);
      await supabase.from("vaccine_history").delete().eq("id", historyData.id);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        history: historyData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mark-vaccine-done:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
