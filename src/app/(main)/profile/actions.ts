'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function deleteUserAccount() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'You must be logged in to delete your account.' }
    }

    const adminSupabase = await createAdminClient()
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      return { success: false, message: deleteError.message }
    }

    // Sign out to clear session cookies
    await supabase.auth.signOut()

    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error during account deletion:', error)
    return { success: false, message: error.message || 'An unexpected error occurred.' }
  }
}
