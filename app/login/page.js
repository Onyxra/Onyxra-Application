'use client';

import { useState } from 'react';
import { getSupabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = getSupabase();

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0f14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="56" height="56" style={{ margin: '0 auto 16px' }}>
            <defs>
              <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4fc3f7"/>
                <stop offset="100%" stopColor="#7c6af7"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="9" fill="url(#loginLogoGrad)"/>
            <text x="18" y="24" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700" fontFamily="Rajdhani, sans-serif">O</text>
          </svg>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            letterSpacing: '2px',
          }}>ONYXRA</h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            marginTop: '6px',
          }}>Your Personal Life Operating System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#131a24',
          borderRadius: '16px',
          border: '1px solid #1e2d40',
          padding: '32px 28px',
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 24px',
            textAlign: 'center',
          }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '6px',
              }}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0b0f14',
                  border: '1px solid #1e2d40',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '6px',
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0b0f14',
                border: '1px solid #1e2d40',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '6px',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0b0f14',
                border: '1px solid #1e2d40',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,83,80,0.1)',
              border: '1px solid rgba(239,83,80,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#ef5350',
            }}>{error}</div>
          )}

          {message && (
            <div style={{
              background: 'rgba(61,220,110,0.1)',
              border: '1px solid rgba(61,220,110,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#3ddc6e',
            }}>{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #4fc3f7 0%, #7c6af7 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '15px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {mode === 'login' ? (
              <>
                {"Don't have an account? "}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4fc3f7',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: 0,
                  }}
                >Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4fc3f7',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: 0,
                  }}
                >Sign in</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
