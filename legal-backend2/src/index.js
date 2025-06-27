const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const documentRoutes = require('./routes/documentRoutes');
const app = express();

dotenv.config();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://legaleagle-uprx.onrender.com'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/docs', documentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
