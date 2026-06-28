import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read .env.local
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const campaigns = [
  {
    brand_name: 'Nike',
    ad_text: "Just do it. It's not about the shoes, it's about what you do in them. Push your limits and redefine what is possible every single day.",
    points_reward: 150,
    completion_cap: 1000,
    is_active: true,
    tile_color: '#000000',
    estimated_time_seconds: 45
  },
  {
    brand_name: 'Apple',
    ad_text: "Pro cameras. Pro display. Pro performance. Meet the new iPhone 15 Pro. Forged in titanium and packed with the groundbreaking A17 Pro chip.",
    points_reward: 120,
    completion_cap: 500,
    is_active: true,
    tile_color: '#555555',
    estimated_time_seconds: 40
  },
  {
    brand_name: 'Tesla',
    ad_text: "Accelerating the world's transition to sustainable energy. Experience the Model 3, engineered for efficiency and safety with unparalleled performance.",
    points_reward: 200,
    completion_cap: 300,
    is_active: true,
    tile_color: '#E82127',
    estimated_time_seconds: 55
  },
  {
    brand_name: 'Spotify',
    ad_text: "Music for everyone. Millions of songs. No credit card needed. Discover new podcasts, curate your playlists, and share your vibe with friends.",
    points_reward: 100,
    completion_cap: 2000,
    is_active: true,
    tile_color: '#1DB954',
    estimated_time_seconds: 35
  }
]

async function seed() {
  console.log('Seeding campaigns...')
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaigns)
    .select()
    
  if (error) {
    console.error('Error seeding campaigns:', error)
  } else {
    console.log(`Successfully seeded ${data.length} campaigns!`)
  }
}

seed()
