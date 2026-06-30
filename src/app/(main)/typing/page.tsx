// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TypingPageClient from './TypingPageClient'

export const dynamic = 'force-dynamic'

export default async function TypingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <TypingPageClient userId={user.id} />
}
