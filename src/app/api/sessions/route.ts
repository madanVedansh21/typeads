import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      session_id,
      user_id,
      campaign_id,
      wpm,
      accuracy,
      keystrokes_data,
      accuracy_samples,
      total_keystrokes,
      correct_keystrokes,
      duration_seconds,
    } = body

    // Verify user matches authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Anti-fraud: check keystroke timing variance
    let isFlaggedByTiming = false
    if (Array.isArray(keystrokes_data) && keystrokes_data.length > 10) {
      const intervals = keystrokes_data
        .map((k: { interval_ms: number }) => k.interval_ms)
        .filter((ms: number) => ms > 0)

      if (intervals.length > 5) {
        const mean = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length
        const variance = intervals.reduce((sum: number, ms: number) => sum + Math.pow(ms - mean, 2), 0) / intervals.length
        const stdDev = Math.sqrt(variance)

        // Humans typically have stdDev > 30ms. Bot-like if stdDev < 10ms
        if (stdDev < 10) {
          isFlaggedByTiming = true
        }
      }
    }

    // Call the complete_session function
    const { data, error } = await supabase.rpc('complete_session', {
      p_session_id: session_id,
      p_user_id: user_id,
      p_campaign_id: campaign_id,
      p_wpm: Math.round(wpm),
      p_accuracy: Math.round(accuracy * 100) / 100,
      p_keystrokes_data: keystrokes_data,
      p_accuracy_samples: accuracy_samples,
      p_total_keystrokes: total_keystrokes,
      p_correct_keystrokes: correct_keystrokes,
      p_duration_seconds: duration_seconds,
    })

    if (error) {
      console.error('Session complete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // If flagged by timing (bot detection), override status
    if (isFlaggedByTiming && data?.success) {
      await supabase
        .from('typing_sessions')
        .update({ is_flagged: true, flag_reason: 'Suspicious keystroke timing variance', status: 'flagged' })
        .eq('id', session_id)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Session API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
