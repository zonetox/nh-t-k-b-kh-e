import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const payload: PushPayload = await req.json()
    const { user_id, title, body, data } = payload

    // 1. Fetch active devices for user
    const { data: devices, error: deviceError } = await supabase
      .from('user_devices')
      .select('device_token')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (deviceError) throw deviceError

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active devices' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Send to each device
    // NOTE: This implementation assumes standard Web Push or FCM
    // For real production, you need to use Google's auth to get an access token
    // Below is a simplified demonstration of sending to Web Push endpoints
    
    let sentCount = 0
    const errors = []

    for (const device of devices) {
      try {
        const subscription = JSON.parse(device.device_token)
        
        // This is a placeholder for the actual FCM send logic
        // In reality, if it's FCM, we use the FCM SDK or direct HTTP v1 API
        // If it's pure Web Push, we'd use a library like 'web-push' (hard in Deno outside of specific packages)
        
        console.log(`Sending push to device: ${device.device_token.substring(0, 50)}...`)
        
        // Simulating success
        sentCount++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push service error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
