'use client';

import React, { useEffect, useState } from 'react';
import ChatWidget from '../../widget/ChatWidget';

export default function DemoStore() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to read the API Key from localStorage (set during demo login)
    const storedKey = localStorage.getItem('demoApiKey');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Fallback for direct visits, just requires an API key in URL to function
      const urlParams = new URLSearchParams(window.location.search);
      setApiKey(urlParams.get('apiKey') || 'MISSING_API_KEY');
    }
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', backgroundColor: '#000', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Demo Store</h1>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Home</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Shop</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, backgroundColor: '#f4f4f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333' }}>Welcome to the Demo Experience</h2>
        <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', lineHeight: '1.6' }}>
          This page simulates a real customer website. Try asking the AI support widget questions based on the preloaded knowledge base (like pricing, return policies, or shipping details).
        </p>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem' }}>
          <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '250px' }}>
            <div style={{ height: '150px', backgroundColor: '#eaeaea', borderRadius: '8px', marginBottom: '1rem' }}></div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Premium Product</h3>
            <p style={{ margin: 0, color: '#0070f3', fontWeight: 'bold' }}>$99.99</p>
          </div>
          <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '250px' }}>
            <div style={{ height: '150px', backgroundColor: '#eaeaea', borderRadius: '8px', marginBottom: '1rem' }}></div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Standard Product</h3>
            <p style={{ margin: 0, color: '#0070f3', fontWeight: 'bold' }}>$49.99</p>
          </div>
        </div>
      </main>

      {/* AI Chat Widget Injection */}
      {apiKey && apiKey !== 'MISSING_API_KEY' ? (
        <ChatWidget 
          tenantApiKey={apiKey} 
          apiUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/chat`}
        />
      ) : (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <strong>No API Key found.</strong><br/> Please log into the dashboard first.
        </div>
      )}
    </div>
  );
}
