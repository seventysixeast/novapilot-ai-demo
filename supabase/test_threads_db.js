const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: threads, error } = await supabase
    .from('chat_threads')
    .select('*')
    .limit(10);

  console.log('Threads in DB:', threads, error);
}

run();
