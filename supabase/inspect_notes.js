const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connectors } = await supabase
    .from('data_connections')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'connected');

  const connector = connectors.find(c => c.organization_id === '99282dad-af28-457e-8503-f28c24e781e1') || connectors[0];
  const accessToken = connector.metadata?.access_token;

  const contactId = '488560659192';
  console.log(`Checking associations for contact ${contactId} in Org: ${connector.organization_id}`);

  // Fetch associations for notes
  // Endpoint: /crm/v4/objects/contacts/{contactId}/associations/notes
  try {
    const assocResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/notes`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (assocResponse.ok) {
      const assocData = await assocResponse.json();
      console.log('HubSpot Contact Notes Associations:', JSON.stringify(assocData, null, 2));

      // Fetch the actual notes if any associations exist
      const notes = assocData.results || [];
      if (notes.length > 0) {
        for (const noteAssoc of notes) {
          const noteId = noteAssoc.id;
          const noteResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/notes/${noteId}?properties=hs_note_body,hs_lastmodifieddate`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (noteResponse.ok) {
            const noteData = await noteResponse.json();
            console.log(`Note ${noteId} Data:`, noteData);
          } else {
            console.error(`Failed to fetch note ${noteId}:`, await noteResponse.text());
          }
        }
      } else {
        console.log('No associated notes found via CRM v3 Associations API.');
      }
    } else {
      console.error('Associations API Error:', await assocResponse.text());
    }
  } catch (e) {
    console.error('Network error checking associations:', e);
  }
}

run();
