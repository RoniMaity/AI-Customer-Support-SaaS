'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// Prevent Next.js from statically pre-rendering this page
export const dynamic = 'force-dynamic';

function WidgetContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('apiKey');

  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const [messages, setMessages] = useState<{id: number, sender: 'user'|'bot', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Missing API Key');
      return;
    }

    // Validate API Key and fetch BotConfig
    const fetchConfig = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiBase}/api/tenant/config`, {
          headers: { 'x-api-key': apiKey }
        });
        
        if (!res.ok) throw new Error('Invalid API Key or Tenant not found');
        
        const data = await res.json();
        setConfig(data);
        
        // Add welcome message from config
        setMessages([
          { id: Date.now(), sender: 'bot', text: data.welcome_message || 'Hello! How can I help?' }
        ]);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchConfig();
  }, [apiKey]);

  const [conversationId] = useState(() => {
    // Generate a simple unique ID for this chat session
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !apiKey) return;

    const userText = inputValue;
    const newMessageId = Date.now();
    
    setMessages(prev => [...prev, { id: newMessageId, sender: 'user', text: userText }]);
    setInputValue('');
    setIsLoading(true);

    const botMessageId = newMessageId + 1;
    setMessages(prev => [...prev, { id: botMessageId, sender: 'bot', text: '' }]);

    try {
      // Send chat request to our backend using the API Key
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey // Include API key in requests for tenant validation
        },
        body: JSON.stringify({ query: userText, conversationId })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: msg.text + chunk } : msg
        ));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId ? { ...msg, text: 'Sorry, I encountered an error.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>{error}</div>;
  }

  if (!config) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading chat...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', backgroundColor: 'white', margin: 0 }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '16px', fontWeight: 'bold' }}>
        {config.bot_name || 'Support Bot'}
      </div>
      
      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9f9f9' }}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              maxWidth: '85%',
              lineHeight: '1.4',
              ...(msg.sender === 'user' 
                ? { backgroundColor: '#0070f3', color: 'white', alignSelf: 'flex-end', borderBottomRightRadius: '0' } 
                : { backgroundColor: '#e5e5ea', color: 'black', alignSelf: 'flex-start', borderBottomLeftRadius: '0' })
            }}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && <div style={{ padding: '10px 14px', borderRadius: '8px', maxWidth: '85%', backgroundColor: '#e5e5ea', color: 'black', alignSelf: 'flex-start', borderBottomLeftRadius: '0' }}>Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', padding: '12px', borderTop: '1px solid #e0e0e0' }}>
        <input 
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button 
          style={{ marginLeft: '8px', padding: '10px 16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }} 
          onClick={handleSend} 
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it during build
export default function WidgetPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading chat...</div>}>
      <WidgetContent />
    </Suspense>
  );
}
