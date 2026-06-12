'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const doLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      if (data.apiKey) localStorage.setItem('demoApiKey', data.apiKey);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email, password);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#fafafa' }}>
      <h1 style={{ marginBottom: '10px' }}>AI Support SaaS Demo</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Experience the multi-tenant admin dashboard.</p>
      
      {/* 1-Click Demo Login Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => doLogin('demo1@test.com', 'password123')}
          disabled={loading}
          style={{ padding: '12px 20px', backgroundColor: '#000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login as Demo User 1 (SaaSify)
        </button>
        <button 
          onClick={() => doLogin('demo2@test.com', 'password123')}
          disabled={loading}
          style={{ padding: '12px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Login as Demo User 2 (ShopEase)
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '350px', borderTop: '1px solid #eaeaea', margin: '1rem 0' }}></div>

      {/* Manual Login */}
      <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '350px', padding: '2rem', backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Manual Login</h3>
        {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
        
        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Email:
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
        
        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Password:
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
