'use client'; // This ensures the component runs on the client to fetch data

import React, { useEffect, useState } from 'react';
import { fetchConversations, fetchTickets, Conversation, Ticket } from './api';

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Basic data fetching on mount
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

    loadData();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Admin Dashboard
            <span style={{ fontSize: '12px', backgroundColor: '#ffd700', color: '#856404', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
              Demo Mode – Sample Data Loaded
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
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Open Tickets</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold' }}>{tickets.filter(t => t.status === 'open').length}</p>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Tickets</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold' }}>{tickets.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Conversations List */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h2 style={{ marginTop: 0 }}>Recent Conversations</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((conv) => (
              <li key={conv.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '16px' }}>{conv.customer_name || 'Anonymous'}</strong>
                </div>
                <small style={{ color: '#888' }}>Session: {conv.session_id}</small>
              </li>
            ))}
            {conversations.length === 0 && <li style={{ color: '#888' }}>No conversations yet.</li>}
          </ul>
        </div>

        {/* Tickets List */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h2 style={{ marginTop: 0 }}>Active Tickets</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tickets.map((ticket) => (
              <li key={ticket.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ 
                    backgroundColor: ticket.status === 'open' ? '#ffeeba' : '#d4edda',
                    color: ticket.status === 'open' ? '#856404' : '#155724',
                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'
                  }}>
                    {ticket.status}
                  </span>
                  <span style={{ 
                    color: ticket.priority === 'high' ? '#dc3545' : '#28a745',
                    fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'
                  }}>
                    {ticket.priority} PRIORITY
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '15px' }}>{ticket.query_summary}</p>
              </li>
            ))}
            {tickets.length === 0 && <li style={{ color: '#888' }}>No tickets yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
