require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const https    = require('https');

const path     = require('path');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://superlative-syrniki-cfe37c.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/clients',         require('./routes/clients'));
app.use('/api/events',          require('./routes/events'));
app.use('/api/payments',        require('./routes/payments'));
app.use('/api/inventory',       require('./routes/inventory'));
app.use('/api/event-inventory', require('./routes/eventInventory'));
app.use('/api/reminders',       require('./routes/reminders'));
app.use('/api/photos',          require('./routes/photos'));
app.use('/api/expenses',        require('./routes/expenses'));
app.use('/api/backup',          require('./routes/backup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5002;

// Start server immediately — don't block on DB connection
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Keep Render free tier alive — ping self every 10 minutes
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL + '/api/health';
    setInterval(() => {
      https.get(url, (res) => {
        console.log(`♻️  Keep-alive ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn('Keep-alive ping failed:', err.message);
      });
    }, 10 * 60 * 1000); // every 10 minutes
  }
});

// Connect to MongoDB with optimized settings for Atlas free tier
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,   // fail fast if Atlas unreachable
    socketTimeoutMS: 45000,
    maxPoolSize: 5,                   // limit connections on free tier
    minPoolSize: 1,                   // keep 1 connection alive
  })
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
    });
} else {
  console.warn('⚠️  MONGO_URI not set — running without database');
}
