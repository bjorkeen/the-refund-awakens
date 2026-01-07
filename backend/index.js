// Packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path'); //christos: needed for static serving

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');

// App
const app = express();


// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } //christos allow frontend to load images
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

//christos serve uploads folder safely (no directory listing, no mime sniffing)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false, //restricts file list visibility
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff'); //forces browser to see it as image, not as a script to run
  }
}));

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

//  DB Toggle Logic
const PORT = process.env.PORT || 5050;
const useMongo = process.env.USE_MONGO === 'true';


if (useMongo) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server (MongoDB) running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
} else {
  app.listen(PORT, () => {
    console.log(`Server (In-Memory) running on http://localhost:${PORT}`);
  });
}