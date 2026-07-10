'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCampaign(formData: FormData) {
  try {
    const brandName = formData.get('brand_name') as string
    const adText = formData.get('ad_text') as string
    const pointsReward = parseInt(formData.get('points_reward') as string)
    const completionCap = parseInt(formData.get('completion_cap') as string)
    const tileColor = formData.get('tile_color') as string
    const isActive = formData.get('is_active') === 'on'

    if (!brandName || !adText || !pointsReward || !completionCap || !tileColor) {
      return { success: false, message: 'All fields are required.' }
    }

    // Use the admin client (service role key) to bypass RLS for this simple prototype
    const supabase = await createAdminClient()

    const { error } = await supabase.from('campaigns').insert({
      brand_name: brandName,
      ad_text: adText,
      points_reward: pointsReward,
      completion_cap: completionCap,
      tile_color: tileColor,
      is_active: isActive,
      estimated_time_seconds: Math.round(adText.length / 5), // Rough estimate: 60 WPM = 5 chars/sec
    } as never)

    if (error) {
      console.error('Error inserting campaign:', error)
      return { success: false, message: error.message }
    }

    // Revalidate paths so the new ad appears immediately if cached
    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, message: 'Ad successfully added to the database!' }
  } catch (err: any) {
    console.error('Failed to add campaign:', err)
    return { success: false, message: 'An unexpected error occurred.' }
  }
}
