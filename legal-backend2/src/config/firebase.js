const admin = require('firebase-admin');

// This configuration is platform-agnostic.
// It reads credentials from an environment variable in production (Vercel/Render)
// and falls back to the local JSON file for development.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db; 