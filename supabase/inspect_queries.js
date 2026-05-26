const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: queries, error } = await supabase
    .from('ai_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching queries:', error);
    return;
  }

  console.log('Last 10 AI Queries:');
  queries.forEach((q, idx) => {
    console.log(`\n[${idx + 1}] ID: ${q.id}`);
    console.log(`Org ID: ${q.organization_id}`);
    console.log(`Query Text: "${q.query_text}"`);
    console.log(`Answer Text Snippet: "${q.answer_text ? q.answer_text.substring(0, 100) : null}"`);
    console.log(`Freshness: ${q.freshness_status}`);
    console.log(`Created At: ${q.created_at}`);
  });
}

run();
