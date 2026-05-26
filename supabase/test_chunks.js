const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying knowledge_chunks:', error);
  } else {
    console.log('Successfully queried knowledge_chunks! Found:', data);
  }
}

run();
