const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const buf = fs.readFileSync(envPath);
  const config = dotenv.parse(buf);
  console.log('Keys in .env.local:', Object.keys(config));
} else {
  console.log('.env.local does not exist!');
}
