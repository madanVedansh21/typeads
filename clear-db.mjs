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

async function clear() {
  console.log('Clearing typing_sessions table...')
  const { error: sessionError } = await supabase
    .from('typing_sessions')
    .delete()
    .neq('status', 'DELETE_ALL_HACK_NEVER_MATCH')
    
  if (sessionError) {
    console.error('Error clearing typing_sessions:', sessionError)
    return
  }

  console.log('Clearing campaigns table...')
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .neq('brand_name', 'DELETE_ALL_HACK_NEVER_MATCH') 
    
  if (error) {
    console.error('Error clearing campaigns:', error)
  } else {
    console.log(`Successfully cleared campaigns table!`)
  }
}

clear()
