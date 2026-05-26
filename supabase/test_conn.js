const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('count');
  if (error) {
    console.error('Public schema error:', error);
  } else {
    console.log('Public schema OK, profile count:', data);
  }
}

testConnection().catch(console.error);
