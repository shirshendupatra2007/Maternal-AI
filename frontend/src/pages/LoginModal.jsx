import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginUser, registerUser, socialLogin, guestLogin } from '../utils/api';
import toast from 'react-hot-toast';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  if (!showLoginModal) return null;

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await registerUser(form);
        toast.success('Account created! Welcome 🌸');
      } else {
        res = await loginUser({ email: form.email, password: form.password });
        toast.success(`Welcome back, ${res.data.user.name}! 🌸`);
      }
      login(res.data.user, res.data.token);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setLoading(true);
    try {
      const mockEmail = `user_${provider}@maternal.app`;
      const mockName = 'Mam';
      const res = await socialLogin({ provider, email: mockEmail, name: mockName });
      toast.success(`Signed in with ${provider}! 🌸`);
      login(res.data.user, res.data.token);
    } catch {
      toast.error(`${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const res = await guestLogin();
      toast('Continuing as guest. Data won\'t be saved permanently. 🌸', { icon: 'ℹ️' });
      login(res.data.user, res.data.token);
    } catch {
      setShowLoginModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 8 }} className="float-anim">🌸</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 6, fontFamily: 'Playfair Display, serif' }} className="gradient-text">
            {mode === 'login' ? 'Welcome Back, Mama' : 'Join MamaAI'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Sign in to access your maternal health records' : 'Create your caring pregnancy journey account'}
          </p>
        </div>

        {/* Social Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button className="btn-social" onClick={() => handleSocial('google')} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button className="btn-social" onClick={() => handleSocial('apple')} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="divider">or continue with email</div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name</label>
              <input
                name="name" type="text" value={form.name}
                onChange={handleChange} required
                className="neuro-input" placeholder="e.g. Priya Sharma"
              />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Email Address</label>
            <input
              name="email" type="email" value={form.email}
              onChange={handleChange} required
              className="neuro-input" placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label className="form-label">Password</label>
            <input
              name="password" type="password" value={form.password}
              onChange={handleChange} required
              className="neuro-input" placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : null}
            {mode === 'login' ? '🌸 Sign In' : '✨ Create Free Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? (
            <>New to MamaAI?{' '}
              <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Skip for now */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(232, 99, 154, 0.16)' }}>
          <button onClick={handleGuest} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
            Skip for now (Guest Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
