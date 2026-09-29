const express = require('express');
const { prepare } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { record_date, week_of_pregnancy, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, mood, sleep_hours, swelling_level, notes } = req.body;
  const date = record_date || new Date().toISOString().split('T')[0];
  const existing = prepare('SELECT id FROM health_trends WHERE user_id = ? AND record_date = ?').get(req.user.id, date);
  
  if (existing) {
    prepare('UPDATE health_trends SET week_of_pregnancy=?, weight=?, blood_pressure_systolic=?, blood_pressure_diastolic=?, heart_rate=?, mood=?, sleep_hours=?, swelling_level=?, notes=? WHERE id=?')
      .run(week_of_pregnancy, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, mood, sleep_hours, swelling_level, notes, existing.id);
  } else {
    prepare('INSERT INTO health_trends (user_id, record_date, week_of_pregnancy, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, mood, sleep_hours, swelling_level, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, date, week_of_pregnancy, weight, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, mood, sleep_hours, swelling_level, notes);
  }
  res.json({ message: 'Trend recorded' });
});

router.get('/', authenticateToken, (req, res) => {
  const { days = 90 } = req.query;
  const from = new Date();
  from.setDate(from.getDate() - parseInt(days));
  const trends = prepare('SELECT * FROM health_trends WHERE user_id = ?').all(req.user.id)
    .filter(t => t.record_date >= from.toISOString().split('T')[0])
    .sort((a, b) => a.record_date.localeCompare(b.record_date));
  res.json({ trends });
});

module.exports = router;
