// Quick script to check assets in database
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://nmfqupzjhrlamyekfbqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZnF1cHpqaHJsYW15ZWtmYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MzM4ODcsImV4cCI6MjA1NDEwOTg4N30.VnF2kNmcz4nC7kF9PtVSjTumcNzZoU7rrwKdQs1jF_k'
)

async function checkAssets() {
  const { data, error } = await supabase
    .from('assets')
    .select('id, asset_code, name, status')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Assets in database:')
  console.log(JSON.stringify(data, null, 2))
}

checkAssets()
