const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function refreshHubSpotToken(connector, supabase) {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const refreshToken = connector.metadata?.refresh_token;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing HubSpot credentials or refresh token in environment/database.');
  }

  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh HubSpot token: ${errorText}`);
  }

  const tokens = await response.json();
  console.log(`Successfully refreshed OAuth tokens for connector ${connector.id}!`);

  const updatedMetadata = {
    ...connector.metadata,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || refreshToken,
    expires_in: tokens.expires_in,
    token_acquired_at: new Date().toISOString(),
  };

  await supabase
    .from('data_connections')
    .update({
      metadata: updatedMetadata,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', connector.id);

  return tokens.access_token;
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get ALL connected HubSpot connectors
  const { data: connectors, error } = await supabase
    .from('data_connections')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'connected');

  if (error || !connectors || connectors.length === 0) {
    console.error('No connected HubSpot connector found.');
    return;
  }

  console.log(`Found ${connectors.length} HubSpot connector(s) to sync.`);

  for (const connector of connectors) {
    console.log(`\n--- Syncing HubSpot connector ID: ${connector.id} for Org: ${connector.organization_id} ---`);

    try {
      let accessToken = connector.metadata?.access_token;
      const tokenAcquiredAt = connector.metadata?.token_acquired_at;
      const expiresIn = connector.metadata?.expires_in || 1800;

      const isExpired = !tokenAcquiredAt || new Date(tokenAcquiredAt).getTime() + (expiresIn * 1000) < Date.now();

      if (isExpired) {
        console.log('HubSpot OAuth token is expired or missing. Refreshing...');
        accessToken = await refreshHubSpotToken(connector, supabase);
      } else {
        console.log('HubSpot OAuth token is still valid.');
      }

      // Fetch contacts from HubSpot API
      console.log('Fetching contacts from HubSpot CRM...');
      const hsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email,city,lifecyclestage,phone,hs_lead_status,hubspot_owner_id', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!hsResponse.ok) {
        const errText = await hsResponse.text();
        throw new Error(`HubSpot CRM API error: ${errText}`);
      }

      const hsData = await hsResponse.json();
      const rawContacts = hsData.results || [];
      console.log(`Fetched ${rawContacts.length} contact(s) from HubSpot.`);

      const formattedContacts = [];
      for (const c of rawContacts) {
        const ownerId = c.properties.hubspot_owner_id || "";
        const ownersMap = {
          "92638790": "Chanchal Rathor"
        };
        const ownerName = ownersMap[ownerId] || "Chanchal Rathor";

        // Fetch associated notes for this contact
        let contactNotes = [];
        try {
          const assocResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${c.id}/associations/notes`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (assocResponse.ok) {
            const assocData = await assocResponse.json();
            const results = assocData.results || [];
            for (const assoc of results) {
              const noteResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/notes/${assoc.id}?properties=hs_note_body`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              if (noteResponse.ok) {
                const noteData = await noteResponse.json();
                const rawBody = noteData.properties?.hs_note_body || "";
                const cleanBody = rawBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                if (cleanBody) {
                  contactNotes.push(cleanBody);
                }
              }
            }
          }
        } catch (noteErr) {
          console.error(`Failed to fetch notes for contact ${c.id}:`, noteErr);
        }

        formattedContacts.push({
          id: c.id,
          firstName: c.properties.firstname || '',
          lastName: c.properties.lastname || '',
          email: c.properties.email || '',
          city: c.properties.city || 'Mohali',
          lifecycleStage: c.properties.lifecyclestage || '',
          leadStatus: c.properties.hs_lead_status || 'OPEN',
          ownerName: ownerName,
          phone: c.properties.phone || 'Not Provided',
          notes: contactNotes,
        });
      }

      // Update connector metadata with synced contacts
      const currentMetadata = (await supabase
        .from('data_connections')
        .select('metadata')
        .eq('id', connector.id)
        .single()).data?.metadata || {};

      const newMetadata = {
        ...currentMetadata,
        contacts: formattedContacts,
        last_contacts_sync_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('data_connections')
        .update({
          metadata: newMetadata,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', connector.id);

      if (updateError) {
        console.error('Error saving contacts to Supabase data_connections metadata:', updateError);
      } else {
        console.log(`Successfully saved synced contacts with notes for Org: ${connector.organization_id}! Contacts count: ${formattedContacts.length}`);
      }

    } catch (e) {
      console.error(`Sync failed for connector ${connector.id}:`, e);
    }
  }
}

run();
