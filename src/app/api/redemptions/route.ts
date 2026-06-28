import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { gift_card_type, denomination, points_cost } = await request.json()

    const { data, error } = await supabase.rpc('request_redemption', {
      p_user_id: user.id,
      p_gift_card_type: gift_card_type,
      p_denomination: denomination,
      p_points_cost: points_cost,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
