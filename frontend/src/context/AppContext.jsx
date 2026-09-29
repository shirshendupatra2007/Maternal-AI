import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getHealthProfile, getTodaySchedule } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mh_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mh_token') || null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCallback, setLoginCallback] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  const login = useCallback((userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('mh_user', JSON.stringify(userData));
    localStorage.setItem('mh_token', tokenStr);
    setShowLoginModal(false);
    if (loginCallback) { loginCallback(); setLoginCallback(null); }
  }, [loginCallback]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setHealthProfile(null);
    localStorage.removeItem('mh_user');
    localStorage.removeItem('mh_token');
  }, []);

  const requireLogin = useCallback((callback) => {
    if (token && user && user.id !== 0) {
      callback && callback();
    } else {
      setLoginCallback(() => callback);
      setShowLoginModal(true);
    }
  }, [token, user]);

  // Load health profile when user logs in
  useEffect(() => {
    if (token && user?.id && user.id !== 0) {
      getHealthProfile()
        .then(res => setHealthProfile(res.data.profile))
        .catch(() => {});

      getTodaySchedule()
        .then(res => {
          setTodaySchedule(res.data.schedule || []);
          // Check for missed medications
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const missed = (res.data.schedule || []).flatMap(med =>
            (med.logs || []).filter(log => log.status === 'pending' && log.time < currentTime)
              .map(log => ({ medName: med.name, time: log.time }))
          );
          if (missed.length > 0) {
            setNotifications(missed.map(m => ({
              id: Date.now() + Math.random(),
              type: 'missed',
              message: `Missed: ${m.medName} at ${m.time}`,
              time: new Date().toLocaleTimeString()
            })));
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  // Notification polling (every 5 min)
  useEffect(() => {
    if (!token || !user?.id || user.id === 0) return;
    const interval = setInterval(() => {
      getTodaySchedule()
        .then(res => {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const missed = (res.data.schedule || []).flatMap(med =>
            (med.logs || []).filter(log => log.status === 'pending' && log.time < currentTime)
              .map(log => ({ medName: med.name, time: log.time }))
          );
          if (missed.length > 0) {
            setNotifications(prev => {
              const newNotifs = missed
                .filter(m => !prev.some(p => p.message.includes(m.medName) && p.message.includes(m.time)))
                .map(m => ({
                  id: Date.now() + Math.random(),
                  type: 'missed',
                  message: `⚠️ Missed: ${m.medName} at ${m.time}`,
                  time: new Date().toLocaleTimeString()
                }));
              return [...prev, ...newNotifs].slice(-10);
            });
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              missed.forEach(m => new Notification('MamaAI - Missed Medication', { body: `You missed ${m.medName} at ${m.time}`, icon: '/favicon.ico' }));
            }
          }
        })
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, user]);

  const dismissNotification = (id) => setNotifications(n => n.filter(x => x.id !== id));

  const isLoggedIn = !!token && !!user && user.id !== 0;
  const isGuest = !!token && !!user && user.id === 0;

  return (
    <AppContext.Provider value={{
      user, token, login, logout, isLoggedIn, isGuest,
      healthProfile, setHealthProfile,
      showLoginModal, setShowLoginModal,
      requireLogin, notifications, dismissNotification,
      todaySchedule, setTodaySchedule
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
