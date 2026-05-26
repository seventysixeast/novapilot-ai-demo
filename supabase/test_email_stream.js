const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Since the server is running on port 3000 in dev mode, we can hit the local endpoint directly!
async function main() {
  const url = 'http://localhost:3000/api/chat/stream';
  console.log('Sending test request to:', url);

  const payload = {
    content: "bh@hubspot.com ko email bhej do that payment is done",
    threadId: "fb395a88-403b-47ee-9989-353c0aa698f7"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // We need to bypass auth or pass the appropriate headers
      // In this environment, we can check if it requires authentication or works locally
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Response failed:', response.status, text);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  console.log('Streaming response:');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    process.stdout.write(chunk);
    fullText += chunk;
  }

  console.log('\n\n--- Finished Stream ---');
  if (fullText.includes('[ACTION_EMAIL:')) {
    console.log('✅ SUCCESS: Stream contains the OUTBOUND EMAIL ACTION TAG!');
  } else {
    console.log('❌ FAILED: Action tag not found.');
  }
}

main().catch(console.error);
