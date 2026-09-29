const express = require('express');
const { prepare } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

router.post('/', authenticateToken, (req, res) => {
  const { activity_date, exercise_type, duration_minutes, steps, is_rest_day, notes, intensity } = req.body;
  const date = activity_date || new Date().toISOString().split('T')[0];
  const dayOfWeek = DAYS[new Date(date + 'T00:00:00').getDay()];
  
  const existing = prepare('SELECT id FROM activities WHERE user_id = ? AND activity_date = ?').get(req.user.id, date);
  if (existing) {
    prepare('UPDATE activities SET exercise_type=?, duration_minutes=?, steps=?, is_rest_day=?, notes=?, intensity=?, day_of_week=? WHERE id=?')
      .run(exercise_type, parseInt(duration_minutes) || 0, parseInt(steps) || 0, is_rest_day ? 1 : 0, notes, intensity || 'low', dayOfWeek, existing.id);
  } else {
    prepare('INSERT INTO activities (user_id, activity_date, day_of_week, exercise_type, duration_minutes, steps, is_rest_day, notes, intensity, doctor_approved) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, date, dayOfWeek, exercise_type, parseInt(duration_minutes) || 0, parseInt(steps) || 0, is_rest_day ? 1 : 0, notes, intensity || 'low', 1);
  }
  res.json({ message: 'Activity logged' });
});

router.get('/weekly', authenticateToken, (req, res) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const fromDate = weekStart.toISOString().split('T')[0];
  
  const activities = prepare('SELECT * FROM activities WHERE user_id = ? AND activity_date >= ?').all(req.user.id, fromDate);
  activities.sort((a, b) => a.activity_date.localeCompare(b.activity_date));
  
  const weeklyPattern = DAYS.map(day => {
    const act = activities.find(a => a.day_of_week === day);
    return { day, activity: act || null };
  });
  
  const totalDuration = activities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const totalSteps = activities.reduce((s, a) => s + (a.steps || 0), 0);
  const restDays = activities.filter(a => a.is_rest_day).length;
  
  res.json({ weekly_pattern: weeklyPattern, total_duration: totalDuration, total_steps: totalSteps, rest_days: restDays });
});

router.get('/history', authenticateToken, (req, res) => {
  const { days = 30 } = req.query;
  const from = new Date();
  from.setDate(from.getDate() - parseInt(days));
  const activities = prepare('SELECT * FROM activities WHERE user_id = ?').all(req.user.id)
    .filter(a => a.activity_date >= from.toISOString().split('T')[0])
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date));
  res.json({ activities });
});

router.get('/exercises', (req, res) => {
  res.json({ exercises: [
    { name: 'Walking', intensity: 'low', duration: '20-30 min', benefits: 'Cardiovascular health, mood boost', trimester: [1, 2, 3], icon: '🚶‍♀️' },
    { name: 'Prenatal Yoga', intensity: 'low', duration: '30-45 min', benefits: 'Flexibility, stress relief, breathing', trimester: [1, 2, 3], icon: '🧘‍♀️' },
    { name: 'Swimming', intensity: 'moderate', duration: '20-30 min', benefits: 'Full body, low impact, relieves back pain', trimester: [1, 2, 3], icon: '🏊‍♀️' },
    { name: 'Stationary Cycling', intensity: 'moderate', duration: '20-30 min', benefits: 'Cardiovascular without impact', trimester: [1, 2], icon: '🚴‍♀️' },
    { name: 'Prenatal Pilates', intensity: 'low', duration: '30 min', benefits: 'Core strength, posture', trimester: [1, 2], icon: '💪' },
    { name: 'Light Stretching', intensity: 'low', duration: '15-20 min', benefits: 'Flexibility, pain relief', trimester: [1, 2, 3], icon: '🤸‍♀️' },
    { name: 'Kegel Exercises', intensity: 'low', duration: '10-15 min', benefits: 'Pelvic floor strength', trimester: [1, 2, 3], icon: '✨' },
    { name: 'Low-Impact Aerobics', intensity: 'moderate', duration: '20-30 min', benefits: 'Energy, cardiovascular health', trimester: [1, 2], icon: '🎵' }
  ]});
});

module.exports = router;
