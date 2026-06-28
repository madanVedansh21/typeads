import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create a nice long readable text with some variety
const loremBase = "The quick brown fox jumps over the lazy dog. A journey of a thousand miles begins with a single step. To be or not to be that is the question. All that glitters is not gold. Actions speak louder than words. Fortune favors the bold. Knowledge is power but enthusiasm pulls the switch. "
const longText = loremBase.repeat(6) // ~160 words

const campaigns = Array.from({ length: 20 }).map((_, i) => ({
  brand_name: `Test Brand ${i + 1}`,
  ad_text: `Welcome to test advertisement number ${i + 1} designed to push your typing speed to the limit. ${longText} We hope you enjoyed typing this incredibly long and repetitive ad copy designed specifically for testing purposes.`,
  points_reward: 200 + i * 10,
  completion_cap: 1000,
  is_active: true,
  tile_color: '#333333',
  estimated_time_seconds: 180
}))

async function seed() {
  console.log('Seeding 20 large campaigns...')
  const { data, error } = await supabase.from('campaigns').insert(campaigns).select()
  if (error) {
    console.error('Error seeding:', error)
  } else {
    console.log(`Successfully seeded ${data.length} large campaigns!`)
  }
}

seed()
