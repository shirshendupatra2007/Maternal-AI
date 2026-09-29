import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, setShowLoginModal, notifications, dismissNotification } = useApp();

  const handleOptionClick = (path) => {
    navigate(path);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px clamp(16px, 4vw, 36px)',
        background: 'rgba(255, 248, 252, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232, 99, 154, 0.15)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(155, 114, 207, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.6rem' }}>🌸</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif' }} className="gradient-text">MamaAI</h1>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: -2 }}>Maternal Health Companion</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLoggedIn ? (
            <>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
                📊 Dashboard
              </button>
              <button className="btn-secondary" onClick={logout} style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowLoginModal(true)} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              ✨ Sign In
            </button>
          )}
        </div>
      </header>

      {/* Notifications bar */}
      {notifications.length > 0 && (
        <div style={{ background: 'rgba(242, 95, 122, 0.1)', borderBottom: '1px solid rgba(242, 95, 122, 0.25)', padding: '10px 18px' }}>
          {notifications.slice(0, 2).map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#c94060' }}>
              <span>🔔 {n.message}</span>
              <button onClick={() => dismissNotification(n.id)} style={{ background: 'none', border: 'none', color: '#c94060', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(36px, 6vw, 60px) clamp(16px, 4vw, 24px)', position: 'relative' }}>
        {/* Soft decorative ambient glow circles */}
        <div style={{ position: 'absolute', width: 'min(550px, 90vw)', height: 'min(550px, 90vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 167, 200, 0.22) 0%, transparent 70%)', top: '5%', left: '8%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 'min(450px, 80vw)', height: 'min(450px, 80vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(180, 141, 216, 0.18) 0%, transparent 70%)', bottom: '8%', right: '8%', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', maxWidth: 740, position: 'relative', width: '100%' }}>
          {/* Greeting Tag */}
          <div style={{ marginBottom: 14 }}>
            <span style={{
              fontSize: 'clamp(0.75rem, 3vw, 0.85rem)', fontWeight: 600,
              color: 'var(--accent-rose)',
              background: 'linear-gradient(135deg, rgba(232, 99, 154, 0.12), rgba(155, 114, 207, 0.12))',
              padding: '6px 16px', borderRadius: 24,
              border: '1px solid rgba(232, 99, 154, 0.25)',
              letterSpacing: '0.5px', display: 'inline-block'
            }}>
              🌸 Welcome, Expecting Mother
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.2rem)', lineHeight: 1.25, marginBottom: 14, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
            Hello, <span className="gradient-text">{
              isLoggedIn && user?.name && !user.name.toLowerCase().includes('demo') && !user.name.toLowerCase().includes('guest')
                ? user.name.split(' ')[0]
                : 'Mam'
            }</span>! 🌸 How can I help you today?
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 3.2vw, 1.1rem)', color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 36px' }}>
            {isLoggedIn
              ? 'Choose an option below depending upon your mood today — fill a quick structured form or chat with AI like you do with your doctor.'
              : 'Your gentle, caring pregnancy companion. Choose how you would like to share your health details today.'}
          </p>

          {/* Input Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 20, marginBottom: 36 }}>
            {/* Precise Input Card */}
            <div
              className="glass-card"
              onClick={() => handleOptionClick('/input/precise')}
              style={{
                padding: 'clamp(22px, 5vw, 34px)', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(254, 243, 248, 0.85))'
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155, 114, 207, 0.18) 0%, transparent 70%)' }} />
              <div style={{ fontSize: '2.4rem', marginBottom: 14 }} className="float-anim">📋</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: 8, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Precise Input</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: 18 }}>
                Fill in structured parameters — weight, pregnancy week, vegetarian/non-vegetarian, food allergies, BP, Vitamin D3, and Iron levels.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Weight', 'Week', 'BP', 'Vitamins', 'Iron'].map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <span className="btn-primary" style={{ fontSize: '0.85rem', padding: '9px 18px', width: '100%', justifyContent: 'center' }}>Fill Form →</span>
              </div>
            </div>

            {/* Conversation Card */}
            <div
              className="glass-card"
              onClick={() => handleOptionClick('/input/conversation')}
              style={{
                padding: 'clamp(22px, 5vw, 34px)', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 245, 250, 0.85))'
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232, 99, 154, 0.18) 0%, transparent 70%)' }} />
              <div style={{ fontSize: '2.4rem', marginBottom: 14 }} className="float-anim">💬</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: 8, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>Chat with AI Doctor</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: 18 }}>
                Speak in natural conversation just like visiting your doctor. Share your health details, symptoms, and feelings comfortably.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Friendly Chat', 'Doctor Tone', 'Comfortable'].map(tag => (
                  <span key={tag} className="tag" style={{ background: 'rgba(155, 114, 207, 0.1)', borderColor: 'rgba(155, 114, 207, 0.25)', color: 'var(--accent-purple)' }}>{tag}</span>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <span className="btn-primary" style={{ fontSize: '0.85rem', padding: '9px 18px', background: 'linear-gradient(135deg, #9b72cf, #e8639a)', width: '100%', justifyContent: 'center' }}>Start Chat →</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px' }}>
              📊 Open Health Dashboard
            </button>
            {!isLoggedIn && (
              <button className="btn-secondary" onClick={() => setShowLoginModal(true)} style={{ padding: '12px 24px' }}>
                🔐 Sign In / Create Account
              </button>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, maxWidth: 960, width: '100%', marginTop: 60 }}>
          {[
            { icon: '🥗', title: 'Nutrition Analysis', desc: 'Daily target tables, meal comparisons & hydration', bg: 'rgba(61, 191, 168, 0.08)' },
            { icon: '💊', title: 'Medication Adherence', desc: 'Prescription timings, reminders & missed dose alerts', bg: 'rgba(155, 114, 207, 0.08)' },
            { icon: '🏃‍♀️', title: 'Physical Activity', desc: 'Doctor-approved exercises, steps & weekly rest days', bg: 'rgba(230, 168, 48, 0.08)' },
            { icon: '📈', title: 'Maternal Trends', desc: 'Monitor weight, BP, mood & sleep patterns over time', bg: 'rgba(232, 99, 154, 0.08)' },
          ].map(f => (
            <div key={f.title} className="glass-card" style={{ padding: 22, textAlign: 'center', background: f.bg }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{f.icon}</div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: 6, color: 'var(--text-primary)' }}>{f.title}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '22px', borderTop: '1px solid rgba(232, 99, 154, 0.12)', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'rgba(255, 248, 252, 0.8)' }}>
        🌸 MamaAI — Designed with love for expecting mothers | Always consult your gynecologist or healthcare specialist for medical care
      </footer>
    </div>
  );
}
