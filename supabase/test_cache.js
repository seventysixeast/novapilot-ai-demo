const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Mock of the getQuestionCache logic
async function testCache() {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const organizationId = "99282dad-af28-457e-8503-f28c24e781e1";
  const queryText = "Please let me know about this user email: bh@hubspot.com";

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cleanQuery = queryText.trim();

  console.log(`Checking cache for: "${cleanQuery}"`);
  console.log(`oneDayAgo: ${oneDayAgo}`);

  const { data, error } = await adminClient
    .from("ai_queries")
    .select("answer_text, created_at, query_text")
    .eq("organization_id", organizationId)
    .ilike("query_text", cleanQuery)
    .eq("freshness_status", "fresh")
    .gt("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error from Supabase:", error);
  } else {
    console.log("Supabase Result:", data);
  }
}

testCache();
