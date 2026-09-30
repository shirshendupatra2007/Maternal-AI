import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('mh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Helper for local mock fallback when hosted statically (e.g. GitHub Pages)
const fallbackStorage = {
  get: (key, def) => {
    try {
      const v = localStorage.getItem(`mh_store_${key}`);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(`mh_store_${key}`, JSON.stringify(val));
    } catch {}
  }
};

// Safe request wrapper that tries API first, then falls back to client mock
async function safeReq(apiCall, fallbackFn) {
  try {
    return await apiCall();
  } catch (err) {
    // If backend is unreachable or 404 (static hosting like GitHub Pages), use fallback
    if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
      return { data: await fallbackFn() };
    }
    throw err;
  }
}

// Auth
export const registerUser = (data) => safeReq(
  () => API.post('/auth/register', data),
  () => {
    const user = { id: 'u_' + Date.now(), name: data.name, email: data.email };
    localStorage.setItem('mh_token', 'local_jwt_token_' + Date.now());
    localStorage.setItem('mh_user', JSON.stringify(user));
    return { token: 'local_token', user };
  }
);

export const loginUser = (data) => safeReq(
  () => API.post('/auth/login', data),
  () => {
    const user = { id: 'u_local', name: data.email.split('@')[0], email: data.email };
    localStorage.setItem('mh_token', 'local_jwt_token_' + Date.now());
    localStorage.setItem('mh_user', JSON.stringify(user));
    return { token: 'local_token', user };
  }
);

export const socialLogin = (data) => safeReq(
  () => API.post('/auth/social', data),
  () => {
    const user = { id: 'u_social', name: data.provider === 'google' ? 'Google Mother' : 'Apple Mother', email: `${data.provider}@example.com` };
    localStorage.setItem('mh_token', 'local_jwt_token_' + Date.now());
    localStorage.setItem('mh_user', JSON.stringify(user));
    return { token: 'local_token', user };
  }
);

export const guestLogin = () => safeReq(
  () => API.post('/auth/guest'),
  () => {
    const user = { id: 'u_guest', name: 'Mam', email: 'guest@mamaai.app' };
    localStorage.setItem('mh_token', 'local_jwt_token_' + Date.now());
    localStorage.setItem('mh_user', JSON.stringify(user));
    return { token: 'local_token', user };
  }
);

export const getMe = () => safeReq(
  () => API.get('/auth/me'),
  () => ({ user: JSON.parse(localStorage.getItem('mh_user') || '{"name":"Mam","email":"guest@mamaai.app"}') })
);

// Health Profile
export const saveHealthProfile = (data) => safeReq(
  () => API.post('/health-profile', data),
  () => {
    fallbackStorage.set('health_profile', data);
    return { profile: data, message: 'Saved locally' };
  }
);

export const getHealthProfile = () => safeReq(
  () => API.get('/health-profile'),
  () => ({
    profile: fallbackStorage.get('health_profile', {
      week_of_pregnancy: 24,
      weight: 62,
      blood_pressure_systolic: 118,
      blood_pressure_diastolic: 76,
      vitamin_d3: 32,
      iron: 12.8,
      diet_type: 'balanced vegetarian',
      nutrient_requirements: {
        calories: { daily: 2200, unit: 'kcal', status: 'normal', note: 'Second trimester +340 kcal/day' },
        protein: { daily: 75, unit: 'g', status: 'normal', note: 'Essential for fetal organ formation' },
        iron: { daily: 27, unit: 'mg', status: 'normal', note: 'Prevents maternal gestational anemia' },
        calcium: { daily: 1000, unit: 'mg', status: 'normal', note: 'Supports baby skeletal mineralization' },
        vitamin_d3: { daily: 600, unit: 'IU', status: 'normal', note: 'Ensures optimal calcium absorption' },
        folic_acid: { daily: 600, unit: 'mcg', status: 'normal', note: 'Neural tube closure support' }
      }
    })
  })
);

// AI
export const analyzeHealth = (data) => safeReq(
  () => API.post('/ai/analyze', data),
  () => ({
    analysis: {
      summary: `Week ${data.week_of_pregnancy || 24} assessment: Vitals and nutritional indicators appear healthy.`,
      nutrient_requirements: {
        calories: { daily: 2200, unit: 'kcal', status: 'normal', note: 'Trimester 2 energy baseline' },
        protein: { daily: 75, unit: 'g', status: 'normal', note: 'Cellular growth' },
        iron: { daily: 27, unit: 'mg', status: 'normal', note: 'Hemoglobin support' },
        calcium: { daily: 1000, unit: 'mg', status: 'normal', note: 'Bone structure' },
        water: { daily: 2500, unit: 'ml', status: 'normal', note: 'Hydration & circulation' }
      },
      warnings: []
    }
  })
);

export const sendChatMessage = (data) => safeReq(
  () => API.post('/ai/chat', data),
  () => ({
    reply: `Hello Mam! 🌸 As your maternal care companion, I hear you. Staying well-hydrated, resting comfortably with supported pillows, and having balanced meals will keep you and your baby thriving today! Feel free to ask me anything about your symptoms or nutrients.`
  })
);

export const analyzeMeal = (data) => safeReq(
  () => API.post('/ai/analyze-meal', data),
  () => {
    const water = Number(data.water_ml) || 1800;
    return {
      analysis: {
        estimated_nutrients: { carbohydrates: 240, proteins: 68, fats: 52, iron: 22, fiber: 28, calcium: 920, water },
        daily_requirements: { carbohydrates: 250, proteins: 75, fats: 60, iron: 27, fiber: 28, calcium: 1000, water: 2500 },
        status: {
          carbohydrates: 'normal',
          proteins: 'normal',
          fats: 'normal',
          iron: 'normal',
          fiber: 'normal',
          calcium: 'normal',
          water: water >= 2500 ? 'normal' : 'deficient'
        },
        notes: 'Balanced whole-food intake with great micronutrient variety. Keep sipping water throughout the evening.'
      }
    };
  }
);

export const getChatHistory = () => safeReq(
  () => API.get('/ai/conversations/default'),
  () => ({ messages: [] })
);

// Medications
export const getMedications = () => safeReq(
  () => API.get('/medications'),
  () => ({
    medications: fallbackStorage.get('meds', [
      { id: 'm1', name: 'Prenatal Multivitamin', dosage: '1 Tablet', frequency: 'Once daily', times: ['08:00'] },
      { id: 'm2', name: 'Calcium + Vitamin D3', dosage: '500mg', frequency: 'Twice daily', times: ['08:00', '20:00'] }
    ])
  })
);

export const addMedication = (data) => safeReq(
  () => API.post('/medications', data),
  () => {
    const meds = fallbackStorage.get('meds', []);
    const newMed = { ...data, id: 'm_' + Date.now() };
    meds.push(newMed);
    fallbackStorage.set('meds', meds);
    return { medication: newMed };
  }
);

export const deleteMedication = (id) => safeReq(
  () => API.delete(`/medications/${id}`),
  () => {
    const meds = fallbackStorage.get('meds', []).filter(m => m.id !== id);
    fallbackStorage.set('meds', meds);
    return { success: true };
  }
);

export const logMedication = (data) => safeReq(
  () => API.post('/medications/log', data),
  () => ({ success: true })
);

export const getMedicationLogs = () => safeReq(
  () => API.get('/medications/logs'),
  () => ({ logs: [] })
);

export const getMedicationAdherence = () => safeReq(
  () => API.get('/medications/adherence'),
  () => ({ stats: { adherence_rate: 92, taken: 24, missed: 2 } })
);

export const getTodaySchedule = () => safeReq(
  () => API.get('/medications/today'),
  () => {
    const meds = fallbackStorage.get('meds', [
      { id: 'm1', name: 'Prenatal Multivitamin', dosage: '1 Tablet', frequency: 'Once daily', times: ['08:00'] },
      { id: 'm2', name: 'Calcium + Vitamin D3', dosage: '500mg', frequency: 'Twice daily', times: ['08:00', '20:00'] }
    ]);
    return {
      schedule: meds.map(m => ({
        ...m,
        logs: (m.times || ['08:00']).map(t => ({ time: t, status: 'pending' }))
      }))
    };
  }
);

// Activities
export const logActivity = (data) => safeReq(
  () => API.post('/activities', data),
  () => ({ activity: data })
);

export const getWeeklyActivities = () => safeReq(
  () => API.get('/activities/weekly'),
  () => ({
    total_duration: 145,
    total_steps: 28400,
    rest_days: 2,
    weekly_pattern: [
      { day: 'Monday', activity: { duration_minutes: 30, steps: 6000, is_rest_day: false } },
      { day: 'Tuesday', activity: { duration_minutes: 25, steps: 5200, is_rest_day: false } },
      { day: 'Wednesday', activity: { duration_minutes: 0, steps: 2100, is_rest_day: true } },
      { day: 'Thursday', activity: { duration_minutes: 30, steps: 5800, is_rest_day: false } },
      { day: 'Friday', activity: { duration_minutes: 35, steps: 6400, is_rest_day: false } },
      { day: 'Saturday', activity: { duration_minutes: 25, steps: 4900, is_rest_day: false } },
      { day: 'Sunday', activity: { duration_minutes: 0, steps: 1800, is_rest_day: true } },
    ]
  })
);

export const getActivityHistory = () => safeReq(
  () => API.get('/activities/history'),
  () => ({ activities: [] })
);

export const getExercises = () => safeReq(
  () => API.get('/activities/exercises'),
  () => ({
    exercises: [
      { name: 'Gentle Prenatal Walking', icon: '🚶‍♀️', duration: '20-30 min', intensity: 'low', benefits: 'Promotes circulation and gentle pelvic mobility', trimester: [1, 2, 3] },
      { name: 'Pelvic Tilts & Cat-Cow', icon: '🧘‍♀️', duration: '15 min', intensity: 'low', benefits: 'Relieves lower back pressure and lumbar tension', trimester: [1, 2, 3] },
      { name: 'Water Aerobics & Swimming', icon: '🏊‍♀️', duration: '25 min', intensity: 'moderate', benefits: 'Zero-gravity joint decompression and cardiac endurance', trimester: [2, 3] },
      { name: 'Prenatal Yoga & Deep Breathing', icon: '🌸', duration: '20 min', intensity: 'low', benefits: 'Calms nervous system and trains labor breath control', trimester: [1, 2, 3] }
    ]
  })
);

// Trends
export const addTrend = (data) => safeReq(
  () => API.post('/trends', data),
  () => ({ trend: data })
);

export const getTrends = () => safeReq(
  () => API.get('/trends'),
  () => ({
    trends: [
      { record_date: '2026-09-10', weight: 60.5, blood_pressure_systolic: 116, blood_pressure_diastolic: 74, heart_rate: 72, mood: 'great', sleep_hours: 8, swelling_level: 'None', week_of_pregnancy: 21 },
      { record_date: '2026-09-17', weight: 61.2, blood_pressure_systolic: 118, blood_pressure_diastolic: 75, heart_rate: 74, mood: 'good', sleep_hours: 7.5, swelling_level: 'Mild', week_of_pregnancy: 22 },
      { record_date: '2026-09-24', weight: 61.8, blood_pressure_systolic: 117, blood_pressure_diastolic: 76, heart_rate: 75, mood: 'great', sleep_hours: 8, swelling_level: 'None', week_of_pregnancy: 23 },
      { record_date: '2026-09-30', weight: 62.3, blood_pressure_systolic: 118, blood_pressure_diastolic: 76, heart_rate: 74, mood: 'great', sleep_hours: 8, swelling_level: 'None', week_of_pregnancy: 24 }
    ]
  })
);

// Meals
export const saveMealLog = (data) => safeReq(
  () => API.post('/meals', data),
  () => ({ log: data })
);

export const getWeeklyMeals = () => safeReq(
  () => API.get('/meals/weekly'),
  () => ({ logs: [] })
);

export const getTodayMeal = () => safeReq(
  () => API.get('/meals/today'),
  () => ({ log: null })
);

export const getMealHistory = () => safeReq(
  () => API.get('/meals'),
  () => ({ logs: [] })
);

export default API;
