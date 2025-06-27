const admin = require('firebase-admin');
const path = require('path');

// Build an absolute path to the service account key
const serviceAccountPath = path.join(__dirname, '..', '..', 'serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();

module.exports = db; 