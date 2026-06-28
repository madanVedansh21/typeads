import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/ui/Topbar'
import { redirect } from 'next/navigation'
import MainLayoutClient from './MainLayoutClient'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <MainLayoutClient>
      <Topbar profile={profile} />
      <div className="page-wrapper">
        {children}
      </div>
    </MainLayoutClient>
  )
}
