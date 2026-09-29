import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('mh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mh_token');
      localStorage.removeItem('mh_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const socialLogin = (data) => API.post('/auth/social', data);
export const guestLogin = () => API.post('/auth/guest');
export const getMe = () => API.get('/auth/me');

// Health Profile
export const saveHealthProfile = (data) => API.post('/health-profile', data);
export const getHealthProfile = () => API.get('/health-profile');

// AI
export const analyzeHealth = (data) => API.post('/ai/analyze', data);
export const sendChatMessage = (data) => API.post('/ai/chat', data);
export const analyzeMeal = (data) => API.post('/ai/analyze-meal', data);
export const getChatHistory = (sessionId) => API.get(`/ai/conversations/${sessionId}`);

// Medications
export const getMedications = () => API.get('/medications');
export const addMedication = (data) => API.post('/medications', data);
export const updateMedication = (id, data) => API.put(`/medications/${id}`, data);
export const deleteMedication = (id) => API.delete(`/medications/${id}`);
export const logMedication = (data) => API.post('/medications/log', data);
export const getMedicationLogs = (params) => API.get('/medications/logs', { params });
export const getMedicationAdherence = (params) => API.get('/medications/adherence', { params });
export const getTodaySchedule = () => API.get('/medications/today');

// Activities
export const logActivity = (data) => API.post('/activities', data);
export const getWeeklyActivities = () => API.get('/activities/weekly');
export const getActivityHistory = (params) => API.get('/activities/history', { params });
export const getExercises = () => API.get('/activities/exercises');

// Trends
export const addTrend = (data) => API.post('/trends', data);
export const getTrends = (params) => API.get('/trends', { params });

// Meals
export const saveMealLog = (data) => API.post('/meals', data);
export const getWeeklyMeals = () => API.get('/meals/weekly');
export const getTodayMeal = () => API.get('/meals/today');
export const getMealHistory = (params) => API.get('/meals', { params });

export default API;
