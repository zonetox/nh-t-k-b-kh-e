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

    // Verify user token directly and get user_id
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth Error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
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

    // Call Atomic RPC in Database
    // This handles ownership check, history insertion, and schedule update in one transaction
    const { data, error: rpcError } = await supabase.rpc("mark_vaccine_done_atomic", {
      p_schedule_id: schedule_id,
      p_user_id: user.id,
      p_injected_date: injected_date,
      p_batch_number: batch_number || null,
      p_location: location || null,
      p_notes: notes || null,
      p_image_paths: image_urls || [],
    });

    if (rpcError) {
      console.error("RPC Business Logic Error:", rpcError);
      
      let status = 400;
      if (rpcError.code === "42501") status = 403; // Forbidden
      if (rpcError.code === "23505") status = 409; // Conflict (Duplicate history)

      return new Response(
        JSON.stringify({ 
          error: rpcError.message || "Không thể thực hiện quy trình tiêm chủng",
          code: rpcError.code 
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        history: data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Internal System Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Đã xảy ra lỗi hệ thống" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
