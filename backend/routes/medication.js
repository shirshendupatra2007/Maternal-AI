const express = require('express');
const { prepare } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get all medications
router.get('/', authenticateToken, (req, res) => {
  const meds = prepare('SELECT * FROM medications WHERE user_id = ? AND active = 1').all(req.user.id);
  res.json({ medications: meds });
});

// Add
router.post('/', authenticateToken, (req, res) => {
  const { name, dosage, frequency, times, start_date, end_date, notes } = req.body;
  if (!name || !dosage || !frequency || !times) return res.status(400).json({ error: 'Required fields missing' });
  const result = prepare('INSERT INTO medications (user_id, name, dosage, frequency, times, start_date, end_date, notes) VALUES (?,?,?,?,?,?,?,?)')
    .run(req.user.id, name, dosage, frequency, JSON.stringify(times), start_date || null, end_date || null, notes || null);
  res.status(201).json({ message: 'Medication added', id: result.lastInsertRowid });
});

// Update
router.put('/:id', authenticateToken, (req, res) => {
  const { name, dosage, frequency, times, notes, active } = req.body;
  prepare('UPDATE medications SET name=?, dosage=?, frequency=?, times=?, notes=?, active=? WHERE id=? AND user_id=?')
    .run(name, dosage, frequency, JSON.stringify(times), notes, active !== undefined ? active : 1, parseInt(req.params.id), req.user.id);
  res.json({ message: 'Updated' });
});

// Delete (soft)
router.delete('/:id', authenticateToken, (req, res) => {
  prepare('UPDATE medications SET active=? WHERE id=? AND user_id=?').run(0, parseInt(req.params.id), req.user.id);
  res.json({ message: 'Removed' });
});

// Log taken/missed
router.post('/log', authenticateToken, (req, res) => {
  const { medication_id, scheduled_time, actual_time, status, log_date, notes } = req.body;
  const existing = prepare('SELECT id FROM medication_logs WHERE user_id = ? AND medication_id = ? AND log_date = ? AND scheduled_time = ?')
    .get(req.user.id, medication_id, log_date, scheduled_time);
  if (existing) {
    prepare('UPDATE medication_logs SET status=?, actual_time=?, notes=? WHERE id=?').run(status, actual_time, notes, existing.id);
  } else {
    prepare('INSERT INTO medication_logs (user_id, medication_id, scheduled_time, actual_time, status, log_date, notes) VALUES (?,?,?,?,?,?,?)')
      .run(req.user.id, medication_id, scheduled_time, actual_time || null, status, log_date, notes || null);
  }
  res.json({ message: `Marked as ${status}` });
});

// Get logs with date range
router.get('/logs', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let logs = prepare('SELECT * FROM medication_logs WHERE user_id = ?').all(req.user.id);
  if (from) logs = logs.filter(l => l.log_date >= from);
  if (to) logs = logs.filter(l => l.log_date <= to);
  // Enrich with medication name
  const meds = prepare('SELECT * FROM medications WHERE user_id = ?').all(req.user.id);
  const medsMap = Object.fromEntries(meds.map(m => [m.id, m]));
  logs = logs.map(l => ({ ...l, name: medsMap[l.medication_id]?.name || 'Unknown', dosage: medsMap[l.medication_id]?.dosage || '' }));
  logs.sort((a, b) => b.log_date.localeCompare(a.log_date));
  res.json({ logs });
});

// Adherence stats
router.get('/adherence', authenticateToken, (req, res) => {
  const { days = 30 } = req.query;
  const from = new Date();
  from.setDate(from.getDate() - parseInt(days));
  const fromStr = from.toISOString().split('T')[0];
  
  const logs = prepare('SELECT * FROM medication_logs WHERE user_id = ?').all(req.user.id).filter(l => l.log_date >= fromStr);
  const total = logs.length;
  const taken = logs.filter(l => l.status === 'taken').length;
  const missed = logs.filter(l => l.status === 'missed').length;
  const pending = logs.filter(l => l.status === 'pending').length;
  const adherence_rate = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;
  
  res.json({ stats: { total, taken, missed, pending, adherence_rate } });
});

// Today's schedule
router.get('/today', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const meds = prepare('SELECT * FROM medications WHERE user_id = ? AND active = ?').all(req.user.id, 1);
  const logs = prepare('SELECT * FROM medication_logs WHERE user_id = ? AND log_date = ?').all(req.user.id, today);

  const schedule = meds.map(med => {
    let times = [];
    try { times = JSON.parse(med.times); } catch { times = [med.times]; }
    return {
      ...med,
      times,
      logs: times.map(time => {
        const log = logs.find(l => String(l.medication_id) === String(med.id) && l.scheduled_time === time);
        return { time, status: log?.status || 'pending', log_id: log?.id };
      })
    };
  });

  res.json({ schedule, date: today });
});

module.exports = router;
