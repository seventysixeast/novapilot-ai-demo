const { Client } = require('pg');

async function test() {
  const password = 'F45AxqiD3Wjoh1mo';
  console.log(`Testing password on port 6543: ${password}`);
  const client = new Client({
    host: 'db.zzbgeukmsifkfmngrjxj.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: password,
    connectionTimeoutMillis: 5000
  });
  try {
    await client.connect();
    console.log(`✅ SUCCESS! Password is: ${password}`);
    await client.end();
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
  }
}

test();
