import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  console.log('ProfileRedirectPage hit for user:', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  console.log('Fetched profile:', profile)

  if (profile?.username) {
    console.log('Redirecting to:', `/profile/${profile.username}`)
    redirect(`/profile/${profile.username}`)
  }

  console.log('Redirecting to dashboard (no username)')
  redirect('/dashboard')
}
