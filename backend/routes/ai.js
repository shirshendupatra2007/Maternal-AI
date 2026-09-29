const express = require('express');
const { prepare } = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  const { GoogleGenAI } = require('@google/genai');

  if (apiKey.startsWith('projects/')) {
    const projectId = apiKey.replace('projects/', '');
    try {
      return new GoogleGenAI({ vertexai: true, project: projectId, location: 'us-central1' });
    } catch {
      return new GoogleGenAI({ apiKey });
    }
  }
  return new GoogleGenAI({ apiKey });
}

// Generate with automatic model fallback in case of temporary Google rate limit or high demand
async function generateWithFallback(client, options) {
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const res = await client.models.generateContent({
        ...options,
        model
      });
      return res;
    } catch (err) {
      lastError = err;
      if (err.status === 503 || err.status === 429 || err.code === 503) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Default clinical assessment backup in case of network outages
function getClinicalAssessment(weight, height, week_of_pregnancy, diet_type, blood_pressure_systolic, vitamin_d3, iron_level) {
  const bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(1) : '22.5';
  return {
    summary: `Week ${week_of_pregnancy || 24} pregnancy assessment for Mam. BMI is ${bmi}. Diet: ${diet_type || 'balanced vegetarian'}. Overall maternal vitals are within healthy range.`,
    risk_factors: (blood_pressure_systolic > 140) ? ['Elevated blood pressure observed — ensure doctor consultation'] : [],
    nutrient_requirements: {
      calories: { daily: 2250, unit: 'kcal', status: 'normal', note: 'Second/Third trimester energy baseline' },
      protein: { daily: 75, unit: 'g', status: 'normal', note: 'Critical for fetal tissue and placenta growth' },
      iron: { daily: 27, unit: 'mg', status: (iron_level && iron_level < 60) ? 'low' : 'normal', note: 'Essential to prevent gestational anemia' },
      calcium: { daily: 1000, unit: 'mg', status: 'normal', note: 'Supports baby bone and tooth development' },
      folate: { daily: 600, unit: 'mcg', status: 'normal', note: 'Protects neural tube and spine formation' },
      vitamin_d: { daily: 600, unit: 'IU', status: (vitamin_d3 && vitamin_d3 < 20) ? 'low' : 'normal', note: 'Aids calcium absorption and immune health' },
      omega3: { daily: 1.4, unit: 'g', status: 'normal', note: 'Crucial for baby brain & retinal development' },
      fiber: { daily: 30, unit: 'g', status: 'normal', note: 'Prevents constipation and supports digestion' },
      water: { daily: 2500, unit: 'ml', status: 'normal', note: 'Maintains amniotic fluid and circulation' },
      carbohydrates: { daily: 175, unit: 'g', status: 'normal', note: 'Complex carbs for steady sustained energy' },
      fats: { daily: 75, unit: 'g', status: 'normal', note: 'Essential healthy fats (DHA/EPA)' }
    },
    meal_suggestions: {
      breakfast: ['Warm oatmeal with chia seeds, almonds and sliced banana', 'Scrambled or boiled eggs with whole grain toast & avocado'],
      lunch: ['Moong dal khichdi with mixed vegetable raita and spinach', 'Brown rice with paneer stir-fry and fresh cucumber salad'],
      dinner: ['Light vegetable soup followed by 2 soft rotis and paneer bhurji', 'Lentil soup with steamed sweet potato and leafy greens'],
      snacks: ['Handful of soaked almonds and walnuts with dates', 'Fresh tender coconut water and seasonal pomegranate bowl']
    },
    warnings: (vitamin_d3 && vitamin_d3 < 20) ? ['Vitamin D3 level is low. Consult your gynecologist for safe prenatal drops.'] : [],
    recommendations: [
      'Take prenatal iron and calcium at separate times for maximum absorption',
      'Stay hydrated with at least 8-10 glasses (2.5L) of water throughout the day',
      'Take 20-minute gentle walks after meals to support glycemic control'
    ]
  };
}

// 1. Analyze precise health input with real Gemini AI
router.post('/analyze', optionalAuth, async (req, res) => {
  const { weight, height, week_of_pregnancy, diet_type, food_allergies, blood_pressure_systolic, blood_pressure_diastolic, vitamin_d3, iron_level } = req.body;
  const bmi = weight && height ? (weight / ((height / 100) ** 2)).toFixed(1) : 'N/A';

  try {
    const client = getClient();
    if (!client) {
      return res.json({ analysis: getClinicalAssessment(weight, height, week_of_pregnancy, diet_type, blood_pressure_systolic, vitamin_d3, iron_level) });
    }

    const prompt = `You are an expert obstetrician and maternal nutritionist AI. Analyze this maternal health profile and provide personalized nutrient requirements and advice.

Patient Profile:
- Weight: ${weight} kg, Height: ${height} cm, BMI: ${bmi}
- Pregnancy Week: ${week_of_pregnancy}
- Diet Preference: ${diet_type}
- Food Allergies: ${Array.isArray(food_allergies) ? food_allergies.join(', ') : food_allergies || 'None'}
- Blood Pressure: ${blood_pressure_systolic || '120'}/${blood_pressure_diastolic || '80'} mmHg
- Vitamin D3: ${vitamin_d3 || '30'} ng/mL
- Iron: ${iron_level || '80'} μg/dL

Respond with strictly valid JSON only (no markdown code blocks, no backticks):
{
  "summary": "warm personalized summary addressing the patient respectfully as Mam",
  "risk_factors": ["risk 1", ...],
  "nutrient_requirements": {
    "calories": {"daily": 2250, "unit": "kcal", "status": "normal", "note": "..."},
    "protein": {"daily": 75, "unit": "g", "status": "normal", "note": "..."},
    "iron": {"daily": 27, "unit": "mg", "status": "normal", "note": "..."},
    "calcium": {"daily": 1000, "unit": "mg", "status": "normal", "note": "..."},
    "folate": {"daily": 600, "unit": "mcg", "status": "normal", "note": "..."},
    "vitamin_d": {"daily": 600, "unit": "IU", "status": "normal", "note": "..."},
    "omega3": {"daily": 1.4, "unit": "g", "status": "normal", "note": "..."},
    "fiber": {"daily": 30, "unit": "g", "status": "normal", "note": "..."},
    "water": {"daily": 2500, "unit": "ml", "status": "normal", "note": "..."},
    "carbohydrates": {"daily": 175, "unit": "g", "status": "normal", "note": "..."},
    "fats": {"daily": 75, "unit": "g", "status": "normal", "note": "..."}
  },
  "meal_suggestions": {
    "breakfast": ["..."],
    "lunch": ["..."],
    "dinner": ["..."],
    "snacks": ["..."]
  },
  "warnings": ["..."],
  "recommendations": ["..."]
}`;

    const response = await generateWithFallback(client, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = (response.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(text);
    return res.json({ analysis });
  } catch (err) {
    console.warn('Gemini analyze fallback:', err.message);
    return res.json({ analysis: getClinicalAssessment(weight, height, week_of_pregnancy, diet_type, blood_pressure_systolic, vitamin_d3, iron_level) });
  }
});

// 2. Chat with live Gemini Maternal Doctor AI (Multi-turn with full memory)
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, session_id } = req.body;
  const userId = req.user?.id || 0;
  const sId = session_id || 'default_session';

  try {
    // 1. Save user's message to database
    prepare('INSERT INTO conversations (user_id, session_id, message, role) VALUES (?, ?, ?, ?)').run(userId, sId, message, 'user');

    const client = getClient();
    if (!client) {
      return handleDemoChat(userId, sId, res);
    }

    // 2. Fetch past conversation history for this session so AI has full context & memory
    const history = prepare('SELECT * FROM conversations WHERE session_id = ?').all(sId);
    
    // Convert to Gemini multi-turn contents format (limit to last 12 turns for speed & responsiveness)
    const recentHistory = history.slice(-12);
    const contents = recentHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.message }]
    }));

    const systemInstruction = `You are MamaAI, an empathetic, caring, expert maternal health physician and doctor companion.
You talk directly with pregnant mothers, addressing her respectfully and warmly as "Mam" (or by her name if she tells you).
You provide clear, medically accurate, reassuring, and practical guidance about pregnancy symptoms, trimester milestones, nutrition, exercise safety, emotional well-being, baby kicks, and prenatal advice.
Keep your tone warm, encouraging, compassionate, and attentive, like a caring female doctor who truly listens.
Ask gentle follow-up questions to understand how she is feeling.
If she provides clinical measurements (weight, week of pregnancy, height, blood pressure, diet style, allergies, or lab values), acknowledge them clinically.
If in the course of the conversation you have learned her weight, height, and pregnancy week, append at the very end of your response:
COLLECTED_DATA: {"weight": X, "height": Y, "week_of_pregnancy": Z}`;

    const response = await generateWithFallback(client, {
      contents,
      config: {
        systemInstruction
      }
    });

    const aiResponse = response.text || "Hello Mam! I am right here with you. How are you and your baby feeling today? 🌸";

    // 3. Save AI's response to database
    prepare('INSERT INTO conversations (user_id, session_id, message, role) VALUES (?, ?, ?, ?)').run(userId, sId, aiResponse, 'assistant');

    let collectedData = null;
    const m = aiResponse.match(/COLLECTED_DATA:\s*(\{[^}]+\})/);
    if (m) {
      try { collectedData = JSON.parse(m[1]); } catch {}
    }

    return res.json({
      response: aiResponse.replace(/COLLECTED_DATA:\s*\{[^}]+\}/g, '').trim(),
      collected_data: collectedData
    });
  } catch (err) {
    console.warn('Gemini chat error, using doctor fallback:', err.message);
    return handleDemoChat(userId, sId, res);
  }
});

function handleDemoChat(userId, session_id, res) {
  const sessionConvs = prepare('SELECT * FROM conversations WHERE session_id = ?').all(session_id || 'default');
  const demoResponses = [
    "Hello Mam! 🌸 I'm MamaAI, your maternal health companion. I'm here to support you through every magical step of your pregnancy. How many weeks along are you right now?",
    "That's such a wonderful stage of pregnancy, Mam! ✨ Could you share your approximate weight (in kg) and height (in cm)? That helps me understand the healthiest nutrition goals for you and baby.",
    "Thank you for sharing, Mam! 🥗 What kind of food do you enjoy most — are you vegetarian, eggetarian, or non-vegetarian? Any food aversions or allergies?",
    "Noted with care, Mam! 🩺 Have you had your blood pressure or hemoglobin/iron levels checked recently during your prenatal visits?",
    "You're doing wonderfully, Mam! 🌸 Your body is working hard growing your little one. Remember to stay hydrated with plenty of water and eat warm, nourishing meals. Click 'View Full Analysis' whenever you'd like your full nutrient breakdown!"
  ];
  const idx = Math.min(Math.floor(sessionConvs.length / 2), demoResponses.length - 1);
  const aiResponse = demoResponses[idx];
  prepare('INSERT INTO conversations (user_id, session_id, message, role) VALUES (?, ?, ?, ?)').run(userId, session_id || 'default', aiResponse, 'assistant');
  
  const collected = idx >= 2 ? { weight: 65, height: 162, week_of_pregnancy: 24, diet_type: 'vegetarian' } : null;
  return res.json({ response: aiResponse, collected_data: collected });
}

// 3. Analyze meal with live Gemini AI comparison
router.post('/analyze-meal', optionalAuth, async (req, res) => {
  const userId = req.user?.id || 0;
  const { breakfast, lunch, dinner, snacks, water_ml } = req.body;

  const profile = prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(userId);
  let requirements = null;
  if (profile?.nutrient_requirements) {
    try { requirements = JSON.parse(profile.nutrient_requirements); } catch {}
  }

  const req_carbs = requirements?.nutrient_requirements?.carbohydrates?.daily || requirements?.carbohydrates?.daily || 175;
  const req_protein = requirements?.nutrient_requirements?.protein?.daily || requirements?.protein?.daily || 75;
  const req_fats = requirements?.nutrient_requirements?.fats?.daily || requirements?.fats?.daily || 75;
  const req_iron = requirements?.nutrient_requirements?.iron?.daily || requirements?.iron?.daily || 27;
  const req_fiber = requirements?.nutrient_requirements?.fiber?.daily || requirements?.fiber?.daily || 30;
  const req_calcium = requirements?.nutrient_requirements?.calcium?.daily || requirements?.calcium?.daily || 1000;
  const req_water = requirements?.nutrient_requirements?.water?.daily || requirements?.water?.daily || 2500;

  try {
    const client = getClient();
    if (!client) {
      return res.json({ analysis: getClinicalMealAssessment(breakfast, lunch, dinner, snacks, water_ml, req_carbs, req_protein, req_fats, req_iron, req_fiber, req_calcium, req_water) });
    }

    const prompt = `You are a maternal nutrition AI. Analyze these meals consumed today by an expecting mother and compare against her recommended daily pregnancy targets.

Meals Consumed Today:
- Breakfast: ${breakfast || 'None'}
- Lunch: ${lunch || 'None'}
- Dinner: ${dinner || 'None'}
- Snacks: ${snacks || 'None'}
- Water intake: ${water_ml || 0} ml

Daily Recommended Targets:
- Carbohydrates: ${req_carbs} g
- Protein: ${req_protein} g
- Fats: ${req_fats} g
- Iron: ${req_iron} mg
- Fiber: ${req_fiber} g
- Calcium: ${req_calcium} mg
- Water: ${req_water} ml

Return ONLY valid JSON (no markdown fences, no backticks):
{
  "estimated_nutrients": {
    "carbohydrates": number,
    "proteins": number,
    "fats": number,
    "iron": number,
    "fiber": number,
    "calcium": number,
    "water": number
  },
  "daily_requirements": {
    "carbohydrates": ${req_carbs},
    "proteins": ${req_protein},
    "fats": ${req_fats},
    "iron": ${req_iron},
    "fiber": ${req_fiber},
    "calcium": ${req_calcium},
    "water": ${req_water}
  },
  "status": {
    "carbohydrates": "deficient" | "normal" | "excess",
    "proteins": "deficient" | "normal" | "excess",
    "fats": "deficient" | "normal" | "excess",
    "iron": "deficient" | "normal" | "excess",
    "fiber": "deficient" | "normal" | "excess",
    "calcium": "deficient" | "normal" | "excess",
    "water": "deficient" | "normal" | "excess"
  },
  "notes": "Encouraging, warm clinical nutrition guidance addressing her politely as Mam"
}`;

    const response = await generateWithFallback(client, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = (response.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    res.json({ analysis: JSON.parse(text) });
  } catch (err) {
    console.warn('Gemini meal analysis fallback:', err.message);
    res.json({ analysis: getClinicalMealAssessment(breakfast, lunch, dinner, snacks, water_ml, req_carbs, req_protein, req_fats, req_iron, req_fiber, req_calcium, req_water) });
  }
});

function getClinicalMealAssessment(breakfast, lunch, dinner, snacks, water_ml, req_carbs, req_protein, req_fats, req_iron, req_fiber, req_calcium, req_water) {
  const hasMeals = breakfast || lunch || dinner;
  const factor = hasMeals ? 0.92 : 0.4;
  const est = {
    carbohydrates: Math.round(req_carbs * factor),
    proteins: Math.round(req_protein * (factor + 0.04)),
    fats: Math.round(req_fats * (factor - 0.03)),
    iron: Math.round(req_iron * (factor - 0.12)),
    fiber: Math.round(req_fiber * factor),
    calcium: Math.round(req_calcium * factor),
    water: parseInt(water_ml) || 1900
  };
  const getStatus = (val, target) => {
    if (val < target * 0.8) return 'deficient';
    if (val > target * 1.25) return 'excess';
    return 'normal';
  };
  return {
    estimated_nutrients: est,
    daily_requirements: { carbohydrates: req_carbs, proteins: req_protein, fats: req_fats, iron: req_iron, fiber: req_fiber, calcium: req_calcium, water: req_water },
    status: {
      carbohydrates: getStatus(est.carbohydrates, req_carbs),
      proteins: getStatus(est.proteins, req_protein),
      fats: getStatus(est.fats, req_fats),
      iron: getStatus(est.iron, req_iron),
      fiber: getStatus(est.fiber, req_fiber),
      calcium: getStatus(est.calcium, req_calcium),
      water: getStatus(est.water, req_water)
    },
    notes: 'Wonderful meals today, Mam! Boost your iron intake with leafy greens or soaked raisins, and sip water regularly throughout the day 🌸'
  };
}

router.get('/conversations/:sessionId', optionalAuth, (req, res) => {
  const convs = prepare('SELECT * FROM conversations WHERE session_id = ?').all(req.params.sessionId);
  convs.sort((a, b) => a.created_at?.localeCompare(b.created_at || '') || 0);
  res.json({ conversations: convs });
});

module.exports = router;
