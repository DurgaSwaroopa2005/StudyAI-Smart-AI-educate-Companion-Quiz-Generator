import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  auth, 
  googleProvider 
} from '../firebase';
import { LogIn, UserPlus, HelpCircle, Mail, Lock, User, Chrome, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState('login'); // login, signup, forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else if (mode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Simple profile updates (mocking display name if needed or setting it via auth helper)
        if (displayName && userCred.user) {
          // Firebase provides updateProfile, but we can do a quick check
          try {
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(userCred.user, { displayName });
          } catch (pErr) {
            console.error("Profile name update failed:", pErr);
          }
        }
        navigate('/');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Please check your inbox.');
        setMode('login');
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          width: '50px',
          height: '50px',
          borderLeft: '2px solid var(--primary)',
          borderTop: '2px solid var(--primary)',
          borderRadius: '10px 0 0 0'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          right: '-10px',
          width: '50px',
          height: '50px',
          borderRight: '2px solid var(--secondary)',
          borderBottom: '2px solid var(--secondary)',
          borderRadius: '0 0 10px 0'
        }} />

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>StudyAI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'login' && 'Welcome back! Sign in to continue your studies.'}
            {mode === 'signup' && 'Create a free account and start learning smarter.'}
            {mode === 'forgot' && 'Reset your password to regain access.'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="badge-danger" style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171'
          }}>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="badge-success" style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#34d399'
          }}>
            <span>{message}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAuth}>
          {mode === 'signup' && (
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="input-control"
                  style={{ paddingLeft: '2.75rem' }}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="input-control"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-control"
                  style={{ paddingLeft: '2.75rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>
                {mode === 'login' && <><LogIn size={18} /> Sign In</>}
                {mode === 'signup' && <><UserPlus size={18} /> Sign Up</>}
                {mode === 'forgot' && <><HelpCircle size={18} /> Send Recovery Link</>}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.75rem' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
        )}

        {/* Google Login */}
        {mode !== 'forgot' && (
          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}
            disabled={loading}
          >
            <Chrome size={18} />
            Google Workspace
          </button>
        )}

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-hover)', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
