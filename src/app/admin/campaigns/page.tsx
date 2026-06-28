import { createClient } from '@/lib/supabase/server'
import CampaignsClient from '@/components/admin/CampaignsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return <CampaignsClient campaigns={campaigns ?? []} />
}
