require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, true); // allow all origins for local use
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Network: http://192.168.29.182:${PORT}/api/health`);
});

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 1,
  })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection failed:', err.message));
} else {
  console.warn('⚠️  MONGO_URI not set — running without database');
}
