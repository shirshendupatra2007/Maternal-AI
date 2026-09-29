import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NutritionTab from '../components/dashboard/NutritionTab';
import MedicationTab from '../components/dashboard/MedicationTab';
import ActivityTab from '../components/dashboard/ActivityTab';
import TrendsTab from '../components/dashboard/TrendsTab';

const TABS = [
  { key: 'nutrition', label: 'Nutrition', shortLabel: 'Nutrition', icon: '🥗', color: 'rgba(61,191,168,0.12)', activeColor: '#3dbfa8' },
  { key: 'medication', label: 'Medication Adherence', shortLabel: 'Meds', icon: '💊', color: 'rgba(155,114,207,0.12)', activeColor: '#9b72cf' },
  { key: 'activity', label: 'Physical Activity', shortLabel: 'Activity', icon: '🏃‍♀️', color: 'rgba(230,168,48,0.12)', activeColor: '#e6a830' },
  { key: 'trends', label: 'Maternal Health Trends', shortLabel: 'Trends', icon: '📈', color: 'rgba(232,99,154,0.12)', activeColor: '#e8639a' },
];

export default function DashboardPage() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, setShowLoginModal, notifications, dismissNotification } = useApp();
  const [activeTab, setActiveTab] = useState(tabParam || 'nutrition');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
