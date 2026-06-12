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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Admin Dashboard</h1>
      
      {/* Simple Metrics */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Conversations</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{conversations.length}</p>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Total Tickets</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{tickets.length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Conversations List */}
        <div style={{ flex: 1 }}>
          <h2>Recent Conversations</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {conversations.map((conv) => (
              <li key={conv.id} style={{ padding: '1rem', border: '1px solid #eee', marginBottom: '1rem', borderRadius: '4px' }}>
                <strong>{conv.customer_name || 'Anonymous'}</strong> ({conv.customer_email || 'No email'})
                <br />
                <small>Session: {conv.session_id}</small>
              </li>
            ))}
          </ul>
        </div>

        {/* Tickets List */}
        <div style={{ flex: 1 }}>
          <h2>Active Tickets</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tickets.map((ticket) => (
              <li key={ticket.id} style={{ padding: '1rem', border: '1px solid #eee', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Status: {ticket.status}</strong>
                  <span style={{ 
                    color: ticket.priority === 'high' ? 'red' : 'green' 
                  }}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
                <p>{ticket.query_summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
