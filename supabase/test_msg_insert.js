const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const threadId = "fb395a88-403b-403b-a7ee-9989-353c0aa698f7";
  const organizationId = "99282dad-af28-457e-8503-f28c24e781e1";

  // Check if thread exists first
  const { data: thread, error: threadErr } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();

  console.log('Thread check:', thread, threadErr);

  // Attempt insert
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      organization_id: organizationId,
      role: 'user',
      content: 'Test content to see insert error',
    })
    .select();

  console.log('Insert result:', data, error);
}

run();
