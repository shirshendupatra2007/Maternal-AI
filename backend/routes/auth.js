const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'maternal_health_secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = prepare('INSERT INTO users (name, email, password, auth_provider) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, 'local');
    const user = prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);
    res.status(201).json({ message: 'Account created!', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Login (Auto-reconciles: logs in existing user or auto-creates new account seamlessly)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    let user = prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      // Auto-create account so user never gets stuck!
      const hashedPassword = await bcrypt.hash(password, 12);
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const result = prepare('INSERT INTO users (name, email, password, auth_provider) VALUES (?, ?, ?, ?)').run(displayName, email, hashedPassword, 'local');
      user = prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken(user);
      return res.status(201).json({ message: 'Account created and logged in!', token, user: { id: user.id, name: user.name, email: user.email } });
    }
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ error: 'Incorrect password for this email' });
    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Social login
router.post('/social', async (req, res) => {
  try {
    const { provider, name, email, providerId } = req.body;
    if (!email || !provider) return res.status(400).json({ error: 'Provider and email required' });
    let user = prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const result = prepare('INSERT INTO users (name, email, auth_provider, provider_id) VALUES (?, ?, ?, ?)').run(name || email.split('@')[0], email, provider, providerId || email);
      user = prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
    const token = generateToken(user);
    res.json({ message: `Signed in with ${provider}`, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    const user = prepare('SELECT id, name, email FROM users WHERE id = ?').get(decoded.id);
    res.json({ user });
  });
});

// Guest
router.post('/guest', (req, res) => {
  const guestUser = { id: 0, name: 'Mam', email: 'guest@maternal.app' };
  const token = jwt.sign(guestUser, JWT_SECRET, { expiresIn: '1d' });
  res.json({ message: 'Continuing as guest', token, user: guestUser });
});

module.exports = router;
