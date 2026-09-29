const express = require('express');
const { prepare } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { weight, height, week_of_pregnancy, diet_type, food_allergies,
      blood_pressure_systolic, blood_pressure_diastolic, vitamin_d3, iron_level, ai_analysis, nutrient_requirements } = req.body;
    const bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(1) : null;

    const existing = prepare('SELECT id FROM health_profiles WHERE user_id = ?').get(userId);
    const allergiesStr = JSON.stringify(food_allergies || []);
    const analysisStr = typeof ai_analysis === 'object' ? JSON.stringify(ai_analysis) : ai_analysis;
    const nutrientsStr = typeof nutrient_requirements === 'object' ? JSON.stringify(nutrient_requirements) : nutrient_requirements;

    if (existing) {
      prepare('UPDATE health_profiles SET weight=?, height=?, week_of_pregnancy=?, diet_type=?, food_allergies=?, blood_pressure_systolic=?, blood_pressure_diastolic=?, vitamin_d3=?, iron_level=?, bmi=?, ai_analysis=?, nutrient_requirements=? WHERE user_id=?')
        .run(weight, height, week_of_pregnancy, diet_type, allergiesStr, blood_pressure_systolic, blood_pressure_diastolic, vitamin_d3, iron_level, bmi, analysisStr, nutrientsStr, userId);
    } else {
      prepare('INSERT INTO health_profiles (user_id, weight, height, week_of_pregnancy, diet_type, food_allergies, blood_pressure_systolic, blood_pressure_diastolic, vitamin_d3, iron_level, bmi, ai_analysis, nutrient_requirements) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(userId, weight, height, week_of_pregnancy, diet_type, allergiesStr, blood_pressure_systolic, blood_pressure_diastolic, vitamin_d3, iron_level, bmi, analysisStr, nutrientsStr);
    }
    res.json({ message: 'Health profile saved', bmi });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticateToken, (req, res) => {
  const profile = prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.json({ profile: null });
  ['food_allergies', 'ai_analysis', 'nutrient_requirements'].forEach(key => {
    if (profile[key]) try { profile[key] = JSON.parse(profile[key]); } catch {}
  });
  res.json({ profile });
});

module.exports = router;
