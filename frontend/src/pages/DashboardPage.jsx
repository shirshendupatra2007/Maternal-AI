import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NutritionTab from '../components/dashboard/NutritionTab';
import MedicationTab from '../components/dashboard/MedicationTab';
import ActivityTab from '../components/dashboard/ActivityTab';
import TrendsTab from '../components/dashboard/TrendsTab';
import MaternalHeroCanvas from '../components/3d/MaternalHeroCanvas';

const TABS = [
  { key: 'nutrition', label: 'Nutrition', shortLabel: 'Nutrition', icon: '🥗', color: 'rgba(61,191,168,0.12)', activeColor: '#3dbfa8' },
  { key: 'medication', label: 'Medication Adherence', shortLabel: 'Meds', icon: '💊', color: 'rgba(155,114,207,0.12)', activeColor: '#9b72cf' },
  { key: 'activity', label: 'Physical Activity', shortLabel: 'Activity', icon: '🏃‍♀️', color: 'rgba(230,168,48,0.12)', activeColor: '#e6a830' },
  { key: 'trends', label: 'Maternal Health Trends', shortLabel: 'Trends', icon: '📈', color: 'rgba(232,99,154,0.12)', activeColor: '#e8639a' },
];

export default function DashboardPage() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { user, healthProfile, isLoggedIn, logout, setShowLoginModal, notifications, dismissNotification } = useApp();
  const [activeTab, setActiveTab] = useState(tabParam || 'nutrition');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [show3DOrb, setShow3DOrb] = useState(false);

  const currentWeek = healthProfile?.week_of_pregnancy || 24;
  const currentTrimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const daysUntilDue = Math.max(0, (40 - currentWeek) * 7);

  useEffect(() => {
    if (tabParam && TABS.find(t => t.key === tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
    navigate(`/dashboard/${key}`, { replace: true });
  };

  const currentTab = TABS.find(t => t.key === activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', flexDirection: 'column' }}>
      {/* Mobile Top Bar (Visible only on mobile/tablet screens <= 900px) */}
      <div className="mobile-top-bar">
        <button
          onClick={() => setSidebarOpen(s => !s)}
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '4px 8px', color: 'var(--text-primary)' }}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/')}>
          <span style={{ fontSize: '1.4rem' }}>🌸</span>
          <span style={{ fontSize: '1.15rem', fontFamily: 'Playfair Display, serif', fontWeight: 700 }} className="gradient-text">MamaAI</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowNotifPanel(s => !s)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', position: 'relative', padding: 4 }}
          >
            🔔
            {notifications.length > 0 && <div className="notif-dot" style={{ position: 'absolute', top: 2, right: 2 }} />}
          </button>
          {!isLoggedIn && (
            <button className="btn-primary" onClick={() => setShowLoginModal(true)} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar Drawer */}
        <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.7rem' }}>🌸</span>
              <div>
                <h2 style={{ fontSize: '1.35rem' }}>MamaAI</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Maternal Care</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ display: sidebarOpen ? 'block' : 'none', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* User Card */}
          {isLoggedIn && (
            <div style={{ padding: '12px 14px', marginBottom: 10, borderRadius: 14, background: 'rgba(232, 99, 154, 0.08)', border: '1px solid rgba(232, 99, 154, 0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #e8639a, #9b72cf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', color: 'white', fontWeight: 600, boxShadow: '0 3px 10px rgba(232, 99, 154, 0.3)' }}>
                  {user?.name?.[0]?.toUpperCase() || 'M'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name && !user.name.toLowerCase().includes('demo') && !user.name.toLowerCase().includes('guest') ? user.name : 'Mam'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Nav items */}
          {TABS.map(tab => (
            <div
              key={tab.key}
              className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <div className="nav-icon" style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.95)' : tab.color }}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: tab.activeColor, boxShadow: `0 0 8px ${tab.activeColor}` }} />
              )}
            </div>
          ))}

          {/* Separator and Bottom links */}
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid rgba(232, 99, 154, 0.15)', paddingTop: 12 }}>
            <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/input/precise'); }}>
              <div className="nav-icon">📋</div>
              <span>Update Parameters</span>
            </div>
            <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/input/conversation'); }}>
              <div className="nav-icon">💬</div>
              <span>Chat with AI</span>
            </div>
            <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/'); }}>
              <div className="nav-icon">🏠</div>
              <span>Home</span>
            </div>
            {isLoggedIn ? (
              <div className="nav-item" onClick={logout} style={{ color: '#c94060' }}>
                <div className="nav-icon">🚪</div>
                <span>Sign Out</span>
              </div>
            ) : (
              <div className="nav-item" onClick={() => { setSidebarOpen(false); setShowLoginModal(true); }}>
                <div className="nav-icon">🔐</div>
                <span>Sign In</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content" style={{ flex: 1 }}>
          {/* Dashboard Header */}
          <div className="dashboard-header">
            <div>
              <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.65rem)', fontFamily: 'Playfair Display, serif', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
                <span>{currentTab?.icon}</span>
                <span className="gradient-text">{currentTab?.label}</span>
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • AI-Powered 3D Maternal Health Suite
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* 3D Orb Toggle */}
              <button
                className="btn-3d-push"
                onClick={() => setShow3DOrb(s => !s)}
                style={{
                  padding: '8px 14px',
                  background: show3DOrb ? 'linear-gradient(135deg, #e8639a, #9b72cf)' : 'rgba(255, 255, 255, 0.9)',
                  color: show3DOrb ? 'white' : 'var(--accent-rose)',
                  border: '1px solid rgba(232, 99, 154, 0.3)',
                  borderRadius: 12,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(232, 99, 154, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{show3DOrb ? '✕ Close 3D' : '🌐 3D Fetal Orb'}</span>
              </button>

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button className="btn-secondary" onClick={() => setShowNotifPanel(s => !s)} style={{ padding: '8px 14px', position: 'relative' }}>
                  🔔
                  {notifications.length > 0 && (
                    <div className="notif-dot" style={{ position: 'absolute', top: 4, right: 4 }} />
                  )}
                </button>
                {showNotifPanel && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 'min(320px, 90vw)',
                    background: 'rgba(255, 248, 252, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(232, 99, 154, 0.2)',
                    borderRadius: 16, padding: 18,
                    boxShadow: '0 16px 48px rgba(155, 114, 207, 0.16)',
                    zIndex: 100
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 12, color: 'var(--text-primary)' }}>Medication Alerts</div>
                    {notifications.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>All medications on schedule today! 🌸</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(232, 99, 154, 0.1)', fontSize: '0.84rem' }}>
                          <div>
                            <div style={{ color: '#c94060', fontWeight: 500, marginBottom: 2 }}>{n.message}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{n.time}</div>
                          </div>
                          <button onClick={() => dismissNotification(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {!isLoggedIn && (
                <button className="btn-primary" onClick={() => setShowLoginModal(true)} style={{ fontSize: '0.85rem', padding: '9px 18px' }}>
                  🔐 Sign In to Save
                </button>
              )}
            </div>
          </div>

          {/* Interactive 3D Gestational Canvas Header (Expandable) */}
          {show3DOrb && (
            <div
              className="glass-card"
              style={{
                marginBottom: 24,
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(255, 250, 253, 0.95), rgba(246, 240, 255, 0.95))',
                border: '1px solid rgba(232, 99, 154, 0.25)',
                boxShadow: '0 16px 48px rgba(155, 114, 207, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✨</span> Real-time 3D Maternal Gestational Environment
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Interactive WebGL 3D simulation — click and drag with your mouse/finger to orbit
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 12, background: 'rgba(232, 99, 154, 0.15)', color: 'var(--accent-rose)', fontWeight: 600 }}>
                  Three.js WebGL 3D
                </span>
              </div>
              <MaternalHeroCanvas height={260} interactive={true} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>💓 Pulsing Embryo Heart Core</span>
                <span>🪐 Trimester Protection Torus</span>
                <span>✨ Amniotic Stardust Field</span>
              </div>
            </div>
          )}

          {/* 3D Trimester Progress & Vitals Ribbon */}
          <div
            className="glass-card"
            style={{
              marginBottom: 26,
              padding: '16px 20px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(254, 243, 248, 0.9))',
              border: '1px solid rgba(232, 99, 154, 0.18)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: 'linear-gradient(135deg, #e8639a, #9b72cf)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', color: 'white',
                boxShadow: '0 6px 18px rgba(232, 99, 154, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
              }}>
                🤰
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GESTATIONAL PROGRESS</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
                  Week {currentWeek} • Trimester {currentTrimester}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Week 1</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{daysUntilDue} Days to Miracle</span>
                <span>Week 40</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(232, 99, 154, 0.15)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(currentWeek / 40) * 100}%`,
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #e8639a, #b48dd8, #3dbfa8)',
                  boxShadow: '0 0 10px rgba(232, 99, 154, 0.5)',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(61, 191, 168, 0.12)', color: '#2aaa8f', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>👶</span> Corn (~30cm)
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(155, 114, 207, 0.12)', color: '#9b72cf', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>💓</span> 142 BPM
              </span>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            {activeTab === 'nutrition' && <NutritionTab />}
            {activeTab === 'medication' && <MedicationTab />}
            {activeTab === 'activity' && <ActivityTab />}
            {activeTab === 'trends' && <TrendsTab />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on phones & small screens <= 900px) */}
      <nav className="mobile-bottom-nav">
        {TABS.map(tab => (
          <div
            key={tab.key}
            className={`mobile-nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <span className="mobile-nav-icon">{tab.icon}</span>
            <span>{tab.shortLabel}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
