const REQUIRED = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLIENT_URL',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const origins = process.env.CLIENT_URL.split(',').map((value) => value.trim()).filter(Boolean);
  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`CLIENT_URL contains an invalid URL: ${origin}`);
    }
  }
}

function getAllowedOrigins() {
  return (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

module.exports = { validateEnv, getAllowedOrigins };

