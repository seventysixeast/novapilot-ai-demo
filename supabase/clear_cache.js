const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function clearCache() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local!");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Clearing all cached AI responses from 'ai_queries'...");
  
  const { error } = await supabase
    .from('ai_queries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (error) {
    console.error("Error clearing database cache:", error);
  } else {
    console.log("Database cache cleared successfully!");
  }
}

clearCache();
