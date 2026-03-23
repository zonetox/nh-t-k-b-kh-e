import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFICATION_TEMPLATES: Record<string, { title: (baby: string, vaccine: string) => string; body: (baby: string, vaccine: string, days?: number) => string }> = {
  T7: {
    title: (baby) => `📅 Sắp đến lịch tiêm cho bé ${baby}`,
    body: (baby, vaccine) => `Mũi ${vaccine} – còn 7 ngày nữa.`,
  },
  T3: {
    title: (baby) => `📅 Lịch tiêm sắp đến cho bé ${baby}`,
    body: (baby, vaccine) => `Mũi ${vaccine} – còn 3 ngày nữa.`,
  },
  T1: {
    title: (baby) => `⏰ Ngày mai bé ${baby} cần tiêm`,
    body: (baby, vaccine) => `${vaccine} – Hãy chuẩn bị cho bé nhé!`,
  },
  T0: {
    title: (baby) => `💉 Hôm nay bé ${baby} đến lịch tiêm`,
    body: (baby, vaccine) => `${vaccine} – Đưa bé đi tiêm ngay hôm nay!`,
  },
  OVERDUE3: {
    title: (baby) => `⚠️ Bé ${baby} đã quá hạn tiêm`,
    body: (baby, vaccine) => `${vaccine} đã quá hạn 3 ngày. Hãy đưa bé đi tiêm sớm!`,
  },
  OVERDUE7: {
    title: (baby) => `🚨 Bé ${baby} quá hạn tiêm ${7} ngày`,
    body: (baby, vaccine) => `${vaccine} đã quá hạn 7 ngày. Vui lòng liên hệ cơ sở y tế!`,
  },
}

const MAX_RETRIES = 3
const RETRY_INTERVALS = [5, 15, 30] // minutes

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Fetch pending jobs where scheduled_at <= now
    const { data: jobs, error: jobsError } = await supabase
      .from('notification_jobs')
      .select(`
        *,
        babies:baby_id (name),
        vaccine_schedules:schedule_id (
          scheduled_date,
          dose_number,
          status,
          vaccines:vaccine_id (name, short_name)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(200)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return new Response(JSON.stringify({ error: jobsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0
    let failedCount = 0

    for (const job of jobs) {
      try {
        // Skip if schedule is already done/skipped
        const scheduleStatus = (job.vaccine_schedules as any)?.status
        if (scheduleStatus === 'done' || scheduleStatus === 'skipped') {
          await supabase
            .from('notification_jobs')
            .update({ status: 'cancelled' })
            .eq('id', job.id)
          continue
        }

        const babyName = (job.babies as any)?.name || 'bé'
        const vaccineName = (job.vaccine_schedules as any)?.vaccines?.name || 'vaccine'
        const template = NOTIFICATION_TEMPLATES[job.notify_type]

        if (!template) {
          console.error(`Unknown notify_type: ${job.notify_type}`)
          continue
        }

        const title = template.title(babyName, vaccineName)
        const body = template.body(babyName, vaccineName)

        // Check quiet hours for user
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('quiet_start, quiet_end')
          .eq('user_id', job.user_id)
          .maybeSingle()

        const quietStart = settings?.quiet_start || '21:00'
        const quietEnd = settings?.quiet_end || '07:00'

        // Check if current time (UTC+7 for Vietnam) is in quiet hours
        const now = new Date()
        const vnHour = (now.getUTCHours() + 7) % 24
        const vnTime = `${vnHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        const qStart = quietStart.substring(0, 5)
        const qEnd = quietEnd.substring(0, 5)

        let inQuietHours = false
        if (qStart > qEnd) {
          // Crosses midnight: 21:00 - 07:00
          inQuietHours = vnTime >= qStart || vnTime < qEnd
        } else {
          inQuietHours = vnTime >= qStart && vnTime < qEnd
        }

        if (inQuietHours) {
          // Reschedule to quiet_end tomorrow morning
          const tomorrow = new Date(now)
          tomorrow.setUTCHours(parseInt(qEnd.split(':')[0]) - 7, parseInt(qEnd.split(':')[1]), 0, 0)
          if (tomorrow <= now) {
            tomorrow.setDate(tomorrow.getDate() + 1)
          }

          await supabase
            .from('notification_jobs')
            .update({ scheduled_at: tomorrow.toISOString() })
            .eq('id', job.id)
          continue
        }

        // Create in-app notification
        if (job.channel === 'inapp') {
          const scheduleId = job.schedule_id
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: job.user_id,
              title,
              body,
              deep_link: `/vaccine/${scheduleId}`,
              job_id: job.id,
            })

          if (notifError) throw notifError
        }

        // Mark job as sent
        await supabase
          .from('notification_jobs')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', job.id)

        sentCount++
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        const newRetryCount = (job.retry_count || 0) + 1

        if (newRetryCount >= MAX_RETRIES) {
          // Move to failed + dead letter queue
          await supabase
            .from('notification_jobs')
            .update({ status: 'failed', retry_count: newRetryCount, error_message: errMsg })
            .eq('id', job.id)

          await supabase
            .from('notification_failures')
            .insert({ job_id: job.id, error_message: errMsg })

          failedCount++
        } else {
          // Schedule retry
          const retryMinutes = RETRY_INTERVALS[newRetryCount - 1] || 30
          const retryAt = new Date(Date.now() + retryMinutes * 60 * 1000)

          await supabase
            .from('notification_jobs')
            .update({
              retry_count: newRetryCount,
              error_message: errMsg,
              scheduled_at: retryAt.toISOString(),
            })
            .eq('id', job.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: jobs.length, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Cron error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
