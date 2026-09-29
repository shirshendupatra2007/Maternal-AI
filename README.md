# 🌸 Pregnency-Health-Tracking — MamaAI Maternal Companion

Pregnancy health tracking is a digital approach to helping expectant mothers monitor important aspects of their health throughout pregnancy. MamaAI brings together nutrition, medication adherence, physical activity, hydration, and maternal health trends in one place, making it easier to understand changes over time.

A modern, empathetic, full-stack AI pregnancy health companion & dashboard built with React, Node.js, Express, and Google Gemini AI.

---

## ✨ Highlights & Features

- **Soft, Nurturing Design**: Crafted with soft blush pinks, gentle lavenders, warm creams, and delicate pastels tailored for expecting mothers.
- **Live Gemini AI Integration**: Powered by `@google/genai` (Gemini Flash) for instant clinical nutrient analysis and conversational maternal guidance.
- **Greeting**: Greets the expecting mother with *"Hello, Mam!"* by default, and seamlessly transitions to *"Hello, [Name]!"* when she signs in with her name.
- **Two Flexible Entry Modes**:
  1. **Precise Input**: Fill in structured vitals (weight, pregnancy week, diet style, allergies, BP, Vitamin D3, Iron) to receive personalized nutrition target tables.
  2. **Chat with AI Doctor**: Speak naturally with MamaAI about symptoms, fatigue, cravings, prenatal advice, and baby growth.
- **Comprehensive 4-Section Dashboard**:
  - **🥗 Nutrition**: Daily nutrient requirements table at top, meal comparison (Carbohydrates, Fats, Proteins, Iron, Fiber, Calcium, Water) with Deficient/Normal/Excess badges, saved by weekdays, with nutrition radar & trend snapshot charts below.
  - **💊 Medication Adherence**: Track prescriptions, set dose times, log Taken/Missed doses, calculate 30-day adherence rates, and receive notifications.
  - **🏃‍♀️ Physical Activity**: Doctor-approved pregnancy-safe exercises, step logging, gentle movement duration, and dedicated rest day tracking.
  - **📈 Maternal Health Trends**: Track weight progression, blood pressure curves, resting heart rate, sleep duration, and daily mood.

---

## 🚀 Quick Start

### Option 1: Double-Click Startup
Double-click `START.bat` in the root folder to start both backend and frontend servers simultaneously.

### Option 2: Terminal Run

#### Backend:
```bash
cd backend
npm install
node server.js
```
*Backend runs on port 5000 (`http://localhost:5000`)*

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on port 5173 (`http://localhost:5173`)*

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend/` directory (see `backend/.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=maternal_health_super_secret_jwt_2024
PORT=5000
NODE_ENV=development
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Recharts, Lucide Icons, React Hot Toast
- **Design System**: Light Glassmorphism, Neumorphic input fields, soft glow effects, responsive layout
- **Backend**: Node.js, Express, LowDB (pure JavaScript flat-file database), JWT, BcryptJS
- **AI**: Official Google GenAI SDK (`@google/genai`) with Gemini Flash

---

## 📁 Repository Structure

```
maternal-health/
├── START.bat
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── server.js
│   ├── db.js
│   └── routes/
│       ├── auth.js
│       ├── ai.js
│       ├── health.js
│       ├── medication.js
│       ├── activity.js
│       ├── trends.js
│       └── meals.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles/globals.css
        ├── context/AppContext.jsx
        ├── utils/api.js
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── LoginModal.jsx
        │   ├── PreciseInputPage.jsx
        │   ├── ConversationPage.jsx
        │   └── DashboardPage.jsx
        └── components/dashboard/
            ├── NutritionTab.jsx
            ├── MedicationTab.jsx
            ├── ActivityTab.jsx
            └── TrendsTab.jsx
```

---

## ⚠️ Medical Disclaimer
MamaAI is an informational wellness and educational tracking application. It is not a replacement for professional clinical diagnosis or hospital care. Always consult your obstetrician, gynecologist, or healthcare provider for all medical decisions during pregnancy.
