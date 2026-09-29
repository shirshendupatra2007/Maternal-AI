const express = require('express');
const { prepare } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

router.post('/', authenticateToken, (req, res) => {
  const { log_date, breakfast, lunch, dinner, snacks, water_ml,
    carbohydrates, fats, proteins, iron, fiber, calcium,
    carb_status, fat_status, protein_status, iron_status, fiber_status, calcium_status, water_status, ai_analysis } = req.body;
  const date = log_date || new Date().toISOString().split('T')[0];
  const dayOfWeek = DAYS[new Date(date + 'T00:00:00').getDay()];
  const analysisStr = typeof ai_analysis === 'object' ? JSON.stringify(ai_analysis) : ai_analysis;

  const existing = prepare('SELECT id FROM meal_logs WHERE user_id = ? AND log_date = ?').get(req.user.id, date);
  if (existing) {
    prepare('UPDATE meal_logs SET day_of_week=?, breakfast=?, lunch=?, dinner=?, snacks=?, water_ml=?, carbohydrates=?, fats=?, proteins=?, iron=?, fiber=?, calcium=?, carb_status=?, fat_status=?, protein_status=?, iron_status=?, fiber_status=?, calcium_status=?, water_status=?, ai_analysis=? WHERE id=?')
      .run(dayOfWeek, breakfast, lunch, dinner, snacks, water_ml, carbohydrates, fats, proteins, iron, fiber, calcium, carb_status, fat_status, protein_status, iron_status, fiber_status, calcium_status, water_status, analysisStr, existing.id);
  } else {
    prepare('INSERT INTO meal_logs (user_id, log_date, day_of_week, breakfast, lunch, dinner, snacks, water_ml, carbohydrates, fats, proteins, iron, fiber, calcium, carb_status, fat_status, protein_status, iron_status, fiber_status, calcium_status, water_status, ai_analysis) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, date, dayOfWeek, breakfast, lunch, dinner, snacks, water_ml, carbohydrates, fats, proteins, iron, fiber, calcium, carb_status, fat_status, protein_status, iron_status, fiber_status, calcium_status, water_status, analysisStr);
  }
  res.json({ message: 'Meal log saved' });
});

router.get('/weekly', authenticateToken, (req, res) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const logs = prepare('SELECT * FROM meal_logs WHERE user_id = ?').all(req.user.id)
    .filter(l => l.log_date >= weekStart.toISOString().split('T')[0])
    .sort((a, b) => a.log_date.localeCompare(b.log_date));
  const parsed = logs.map(l => ({ ...l, ai_analysis: l.ai_analysis ? (() => { try { return JSON.parse(l.ai_analysis); } catch { return l.ai_analysis; } })() : null }));
  res.json({ logs: parsed });
});

router.get('/today', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const log = prepare('SELECT * FROM meal_logs WHERE user_id = ? AND log_date = ?').get(req.user.id, today);
  if (log && log.ai_analysis) try { log.ai_analysis = JSON.parse(log.ai_analysis); } catch {}
  res.json({ log: log || null });
});

router.get('/', authenticateToken, (req, res) => {
  const { limit = 30, offset = 0 } = req.query;
  const logs = prepare('SELECT * FROM meal_logs WHERE user_id = ?').all(req.user.id)
    .sort((a, b) => b.log_date.localeCompare(a.log_date))
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({ logs });
});

module.exports = router;
