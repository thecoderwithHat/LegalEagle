const admin = require('firebase-admin');

// This configuration is platform-agnostic.
// It reads credentials from an environment variable in production (Vercel/Render)
// For local development, it uses a stub configuration if serviceAccountKey.json is not available
let db;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../../serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
} catch (error) {
  console.warn('⚠️  Firebase credentials not found. Using mock Firestore for local development.');
  console.warn('📝 To use real Firebase: place serviceAccountKey.json in the project root or set FIREBASE_SERVICE_ACCOUNT env variable.\n');
  
  // In-memory storage for mock data
  const mockData = {};

  // Helper to create a queryable collection object
  const createCollectionQuery = (name, orderByField = null, sortDirection = 'asc') => {
    if (!mockData[name]) {
      mockData[name] = {};
    }

    return {
      doc: (id) => ({
        set: async (data) => {
          mockData[name][id] = data;
          console.log(`Mock: Set ${name}/${id}`);
        },
        get: async () => {
          const data = mockData[name][id];
          return {
            exists: !!data,
            data: () => data || {},
            id: id
          };
        },
        update: async (data) => {
          if (mockData[name][id]) {
            mockData[name][id] = { ...mockData[name][id], ...data };
            console.log(`Mock: Update ${name}/${id}`);
          }
        },
        delete: async () => {
          delete mockData[name][id];
          console.log(`Mock: Delete ${name}/${id}`);
        }
      }),
      add: async (data) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        mockData[name][id] = data;
        console.log(`Mock: Add to ${name}`, data);
        return { id };
      },
      orderBy: (field, direction = 'asc') => {
        return createCollectionQuery(name, field, direction);
      },
      where: () => ({ get: async () => ({ docs: [] }) }),
      get: async () => {
        let docs = Object.entries(mockData[name]).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));

        // Sort if orderBy was specified
        if (orderByField) {
          docs.sort((a, b) => {
            const aVal = a.data()[orderByField];
            const bVal = b.data()[orderByField];
            
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return { docs };
      }
    };
  };

  // Create a mock Firestore object for local development
  db = {
    collection: (name) => createCollectionQuery(name)
  };
}

module.exports = db; 