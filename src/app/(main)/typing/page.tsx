// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import TypingPageClient from './TypingPageClient'

export const dynamic = 'force-dynamic'

export default async function TypingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guests are allowed — they get practice mode with no saving
  return <TypingPageClient userId={user?.id ?? null} />
}
