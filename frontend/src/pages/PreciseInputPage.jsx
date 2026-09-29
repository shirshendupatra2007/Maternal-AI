import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeHealth, saveHealthProfile } from '../utils/api';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'basic', title: 'Basic Info', icon: '👤' },
  { key: 'pregnancy', title: 'Pregnancy', icon: '🤰' },
  { key: 'diet', title: 'Diet & Allergies', icon: '🥗' },
  { key: 'vitals', title: 'Vitals & Labs', icon: '🩺' },
];

const ALLERGY_OPTIONS = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Soy', 'Seafood', 'Shellfish', 'Sesame'];

export default function PreciseInputPage() {
  const navigate = useNavigate();
  const { requireLogin, setHealthProfile } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    weight: '', height: '', week_of_pregnancy: '',
    diet_type: 'vegetarian', food_allergies: [],
    blood_pressure_systolic: '', blood_pressure_diastolic: '',
    vitamin_d3: '', iron_level: ''
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleAllergy = (allergy) => {
    setForm(f => ({
      ...f,
      food_allergies: f.food_allergies.includes(allergy)
        ? f.food_allergies.filter(a => a !== allergy)
        : [...f.food_allergies, allergy]
    }));
  };

  const handleSubmit = async () => {
    requireLogin(async () => {
      setLoading(true);
      try {
        const analysisRes = await analyzeHealth(form);
        const analysis = analysisRes.data.analysis;
        await saveHealthProfile({ ...form, ai_analysis: analysis, nutrient_requirements: analysis });
        setHealthProfile({ ...form, ai_analysis: analysis, nutrient_requirements: analysis });
        toast.success('Health profile analyzed! 🌸');
        navigate('/dashboard/nutrition');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  };

  const canNext = () => {
    if (step === 0) return form.weight && form.height;
    if (step === 1) return form.week_of_pregnancy;
    if (step === 2) return form.diet_type;
    return true;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px clamp(14px, 4vw, 36px)',
        background: 'rgba(255, 248, 252, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232, 99, 154, 0.15)',
        boxShadow: '0 2px 14px rgba(155, 114, 207, 0.06)'
      }}>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>← Back</button>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'Playfair Display, serif' }} className="gradient-text">Precise Health Input</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fill in your parameters for personalized pregnancy care</p>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(18px, 4vw, 32px) clamp(12px, 3vw, 24px)' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 'clamp(36px, 9vw, 44px)', height: 'clamp(36px, 9vw, 44px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(0.95rem, 3vw, 1.2rem)',
                    background: i <= step
                      ? 'linear-gradient(135deg, #e8639a, #9b72cf)'
                      : 'rgba(255, 255, 255, 0.85)',
                    border: i === step ? '2px solid #e8639a' : '1px solid rgba(232, 99, 154, 0.2)',
                    boxShadow: i <= step ? '0 4px 16px rgba(232, 99, 154, 0.35)' : '0 2px 6px rgba(155, 114, 207, 0.08)',
                    color: i <= step ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.3s',
                    cursor: i < step ? 'pointer' : 'default'
                  }}
                    onClick={() => i < step && setStep(i)}
                  >
                    {i < step ? '✓' : s.icon}
                  </div>
                  <span style={{ fontSize: 'clamp(0.64rem, 2.2vw, 0.74rem)', fontWeight: i === step ? 600 : 500, color: i <= step ? 'var(--accent-rose)' : 'var(--text-muted)', marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ height: 2, flex: 1, background: i < step ? 'linear-gradient(90deg, #e8639a, #9b72cf)' : 'rgba(232, 99, 154, 0.18)', marginBottom: 20, transition: 'all 0.4s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step Card */}
          <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 36px)', background: 'rgba(255, 255, 255, 0.9)' }}>
            {/* Step 0: Basic */}
            {step === 0 && (
              <div style={{ animation: 'slideUp 0.4s ease' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 6, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Basic Measurements</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 26, fontSize: '0.9rem' }}>Let's start with your current weight and height</p>
                <div className="grid-2">
                  <div>
                    <label className="form-label">Weight (kg)</label>
                    <input name="weight" type="number" value={form.weight} onChange={handleChange} className="neuro-input" placeholder="e.g. 64" min="30" max="200" />
                  </div>
                  <div>
                    <label className="form-label">Height (cm)</label>
                    <input name="height" type="number" value={form.height} onChange={handleChange} className="neuro-input" placeholder="e.g. 162" min="100" max="250" />
                  </div>
                </div>
                {form.weight && form.height && (
                  <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 12, background: 'rgba(155, 114, 207, 0.1)', border: '1px solid rgba(155, 114, 207, 0.25)', fontSize: '0.88rem', color: 'var(--accent-purple)' }}>
                    📊 Calculated Pre-pregnancy/Current BMI: <strong>
                      {(form.weight / ((form.height / 100) ** 2)).toFixed(1)}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Pregnancy */}
            {step === 1 && (
              <div style={{ animation: 'slideUp 0.4s ease' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 6, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Pregnancy Details</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 26, fontSize: '0.9rem' }}>How many weeks along is your pregnancy?</p>
                <div>
                  <label className="form-label">Week of Pregnancy</label>
                  <input name="week_of_pregnancy" type="number" value={form.week_of_pregnancy} onChange={handleChange} className="neuro-input" placeholder="e.g. 24" min="1" max="42" />
                  {form.week_of_pregnancy && (
                    <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(232, 99, 154, 0.1)', border: '1px solid rgba(232, 99, 154, 0.25)', fontSize: '0.88rem', color: 'var(--accent-rose)' }}>
                      🤰 {form.week_of_pregnancy <= 12 ? '1st' : form.week_of_pregnancy <= 27 ? '2nd' : '3rd'} Trimester — Week {form.week_of_pregnancy}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Diet */}
            {step === 2 && (
              <div style={{ animation: 'slideUp 0.4s ease' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 6, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Diet & Allergies</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>Your food habits guide our nutrient recommendations</p>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">Dietary Preference</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan'].map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, diet_type: d }))}
                        style={{
                          padding: '10px 18px', borderRadius: 12, border: '1px solid',
                          cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                          background: form.diet_type === d ? 'linear-gradient(135deg, rgba(232, 99, 154, 0.18), rgba(155, 114, 207, 0.15))' : 'rgba(255, 255, 255, 0.75)',
                          borderColor: form.diet_type === d ? 'rgba(232, 99, 154, 0.5)' : 'rgba(232, 99, 154, 0.18)',
                          color: form.diet_type === d ? 'var(--accent-rose)' : 'var(--text-secondary)',
                          boxShadow: form.diet_type === d ? '0 4px 14px rgba(232, 99, 154, 0.18)' : 'none',
                          transition: 'all 0.2s', textTransform: 'capitalize'
                        }}>
                        {d === 'vegetarian' ? '🥗' : d === 'non-vegetarian' ? '🍗' : d === 'eggetarian' ? '🥚' : '🌱'} {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Any Food Allergies or Intolerances?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {ALLERGY_OPTIONS.map(a => (
                      <button key={a} onClick={() => toggleAllergy(a)}
                        style={{
                          padding: '8px 16px', borderRadius: 24, border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                          background: form.food_allergies.includes(a) ? 'rgba(242, 95, 122, 0.14)' : 'rgba(255, 255, 255, 0.75)',
                          borderColor: form.food_allergies.includes(a) ? 'rgba(242, 95, 122, 0.45)' : 'rgba(232, 99, 154, 0.18)',
                          color: form.food_allergies.includes(a) ? '#c94060' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}>
                        {form.food_allergies.includes(a) ? '✓ ' : ''}{a}
                      </button>
                    ))}
                    {form.food_allergies.length > 0 && (
                      <button onClick={() => setForm(f => ({ ...f, food_allergies: [] }))}
                        style={{ padding: '8px 14px', borderRadius: 24, border: '1px solid rgba(232, 99, 154, 0.2)', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent', color: 'var(--text-muted)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Vitals */}
            {step === 3 && (
              <div style={{ animation: 'slideUp 0.4s ease' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 6, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Vitals & Lab Values</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 26, fontSize: '0.9rem' }}>Enter your latest clinic visit readings</p>

                <div style={{ marginBottom: 18 }}>
                  <label className="form-label">Blood Pressure (mmHg)</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input name="blood_pressure_systolic" type="number" value={form.blood_pressure_systolic} onChange={handleChange} className="neuro-input" placeholder="Systolic (e.g. 120)" min="60" max="200" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>/</span>
                    <input name="blood_pressure_diastolic" type="number" value={form.blood_pressure_diastolic} onChange={handleChange} className="neuro-input" placeholder="Diastolic (e.g. 80)" min="40" max="140" />
                  </div>
                  {form.blood_pressure_systolic && form.blood_pressure_diastolic && (
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: form.blood_pressure_systolic > 140 ? '#c94060' : '#2aaa8f' }}>
                      {form.blood_pressure_systolic > 140 ? '⚠️ High BP — will highlight in clinical precautions' : '✓ Blood pressure looks normal and healthy'}
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div>
                    <label className="form-label">Vitamin D3 (ng/mL)</label>
                    <input name="vitamin_d3" type="number" value={form.vitamin_d3} onChange={handleChange} className="neuro-input" placeholder="e.g. 30" step="0.1" />
                    {form.vitamin_d3 && <div style={{ marginTop: 4, fontSize: '0.78rem', color: form.vitamin_d3 < 20 ? '#c94060' : '#2aaa8f' }}>{form.vitamin_d3 < 20 ? '⚠️ Low (<20 ng/mL)' : '✓ Normal'}</div>}
                  </div>
                  <div>
                    <label className="form-label">Iron Level / Hemoglobin (μg/dL)</label>
                    <input name="iron_level" type="number" value={form.iron_level} onChange={handleChange} className="neuro-input" placeholder="e.g. 80" />
                    {form.iron_level && <div style={{ marginTop: 4, fontSize: '0.78rem', color: form.iron_level < 60 ? '#c94060' : '#2aaa8f' }}>{form.iron_level < 60 ? '⚠️ Below optimal' : '✓ Normal'}</div>}
                  </div>
                </div>

                <div style={{ marginTop: 22, padding: 14, borderRadius: 12, background: 'rgba(61, 191, 168, 0.1)', border: '1px solid rgba(61, 191, 168, 0.25)', fontSize: '0.85rem', color: '#2aaa8f' }}>
                  ✨ Our AI will tailor your daily nutrient requirements chart to keep both you and baby thriving.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 14 }}>
              <button
                className="btn-secondary"
                onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/')}
                style={{ flex: 1 }}
              >
                {step === 0 ? '✕ Cancel' : '← Back'}
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  style={{ flex: 1, opacity: !canNext() ? 0.5 : 1, justifyContent: 'center' }}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : null}
                  {loading ? 'Analyzing...' : '🌸 Analyze & View Dashboard'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
