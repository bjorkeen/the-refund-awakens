// Packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');

// App
const app = express();


// Middleware
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Test Endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API running' });
});

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// 🌐 DB Toggle Logic
const PORT = process.env.PORT || 5050;
const useMongo = process.env.USE_MONGO === 'true';


if (useMongo) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`🚀 Server (MongoDB) running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
    });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server (In-Memory) running on http://localhost:${PORT}`);
  });
}
