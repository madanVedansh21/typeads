import { createClient } from '@/lib/supabase/server'
import UsersClient from '@/components/admin/UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Flagged sessions count per user
  const { data: flaggedSessions } = await supabase
    .from('typing_sessions')
    .select('user_id')
    .eq('is_flagged', true)

  const flaggedMap: Record<string, number> = {}
  flaggedSessions?.forEach(s => {
    flaggedMap[s.user_id] = (flaggedMap[s.user_id] ?? 0) + 1
  })

  return <UsersClient users={users ?? []} flaggedMap={flaggedMap} />
}
