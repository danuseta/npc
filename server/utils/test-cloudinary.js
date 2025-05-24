require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dror0oa3z',
  api_key: '261585448195571',
  api_secret: 'rlGPZz-w7QWsOzmbN8kDg03dtoo'
});

async function testConnection() {
  try {
    const result = await cloudinary.api.ping();
    console.log('Connected to Cloudinary:', result);
  } catch (error) {
    console.error('Cloudinary connection failed:', error);
  }
}

testConnection();