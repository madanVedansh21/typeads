import { createClient } from '@/lib/supabase/server'
import RedemptionsClient from '@/components/admin/RedemptionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminRedemptionsPage() {
  const supabase = await createClient()

  const { data: redemptions } = await supabase
    .from('redemption_requests')
    .select(`*, profiles(username, email)`)
    .order('requested_at', { ascending: false })

  return <RedemptionsClient redemptions={(redemptions as any) ?? []} />
}
