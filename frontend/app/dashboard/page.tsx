'use client'; // This ensures the component runs on the client to fetch data

import React, { useEffect, useState, useRef } from 'react';
import { fetchConversations, fetchTickets, getConversationMessages, sendAdminReply, Conversation, Ticket } from './api';

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Live Chat State
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [convs, tks] = await Promise.all([fetchConversations(), fetchTickets()]);
      setConversations(convs);
      setTickets(tks);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // In a real app, you would use socket.io here to auto-refresh the list
    const interval = setInterval(loadData, 5000); // Polling for demo simplicity
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      getConversationMessages(selectedChat.session_id).then(setMessages);
    }
  }, [selectedChat, conversations]); // Refresh messages when conversations update

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async () => {
    if (!selectedChat || !replyText.trim()) return;
    const text = replyText;
    setReplyText('');
    
    // Optimistic UI
    setMessages(prev => [...prev, { id: Date.now(), sender: 'admin', content: text }]);
    
    await sendAdminReply(selectedChat.session_id, text);
    // Reload messages
    const msgs = await getConversationMessages(selectedChat.session_id);
    setMessages(msgs);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  const liveChats = conversations.filter(c => c.is_human_takeover);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Admin Dashboard
            <span style={{ fontSize: '12px', backgroundColor: '#ffd700', color: '#856404', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              Live Chat Mode Active
            </span>
          </h1>
        </div>
        <button 
          onClick={() => window.location.href = '/demo'}
          style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Test Customer Chat &rarr;
        </button>
      </div>
      
      {/* Simple Metrics */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Conversations</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold' }}>{conversations.length}</p>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Active Escalations</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold', color: '#dc3545' }}>{liveChats.length}</p>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Tickets</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold' }}>{tickets.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left Column: Recent & Live */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '2px solid #ff4d4f' }}>
            <h2 style={{ marginTop: 0, color: '#ff4d4f' }}>Live Handoffs (Requires Action)</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {liveChats.map((conv) => (
                <li key={conv.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: selectedChat?.id === conv.id ? '#fff1f0' : 'transparent' }} onClick={() => setSelectedChat(conv)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '16px', color: '#ff4d4f' }}>{conv.customer_name || 'Anonymous'}</strong>
                    <span style={{ fontSize: '12px', backgroundColor: '#ff4d4f', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                  </div>
                  <small style={{ color: '#888' }}>Session: {conv.session_id}</small>
                </li>
              ))}
              {liveChats.length === 0 && <li style={{ color: '#888' }}>No live chats right now.</li>}
            </ul>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eaeaea' }}>
            <h2 style={{ marginTop: 0 }}>Recent Conversations (AI Handled)</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {conversations.filter(c => !c.is_human_takeover).map((conv) => (
                <li key={conv.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '16px' }}>{conv.customer_name || 'Anonymous'}</strong>
                  </div>
                  <small style={{ color: '#888' }}>Session: {conv.session_id}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Chat Window or Tickets */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {selectedChat ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Chatting with: {selectedChat.session_id}</h3>
                <button onClick={() => setSelectedChat(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
              
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fafafa' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'admin' ? '#0070f3' : (msg.sender === 'ai' ? '#e5e5ea' : 'white'),
                    color: msg.sender === 'admin' ? 'white' : 'black',
                    padding: '8px 12px', borderRadius: '8px', maxWidth: '80%',
                    border: msg.sender === 'user' ? '1px solid #ccc' : 'none'
                  }}>
                    <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>{msg.sender.toUpperCase()}</div>
                    {msg.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid #eaeaea', display: 'flex', gap: '10px' }}>
                <input 
                  value={replyText} onChange={e => setReplyText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type reply to customer..." 
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button onClick={handleSendReply} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reply</button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eaeaea' }}>
              <h2 style={{ marginTop: 0 }}>Active Tickets</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tickets.map((ticket) => (
                  <li key={ticket.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: ticket.status === 'open' ? '#ffeeba' : '#d4edda', color: ticket.status === 'open' ? '#856404' : '#155724', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px' }}>{ticket.query_summary}</p>
                  </li>
                ))}
                {tickets.length === 0 && <li style={{ color: '#888' }}>No tickets yet.</li>}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
