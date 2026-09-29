require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize DB
require('./db');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const aiRoutes = require('./routes/ai');
const medicationRoutes = require('./routes/medication');
const activityRoutes = require('./routes/activity');
const trendsRoutes = require('./routes/trends');
const mealRoutes = require('./routes/meals');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Maternal Health API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/health-profile', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/meals', mealRoutes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🌸 MamaAI Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api\n`);
});

module.exports = app;
