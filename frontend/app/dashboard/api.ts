export type Conversation = {
  id: string;
  session_id: string;
  customer_name: string | null;
  customer_email: string | null;
};

export type Ticket = {
  id: string;
  query_summary: string;
  priority: string;
  status: string;
};

// Uses NEXT_PUBLIC_API_URL from environment, falls back to localhost for dev
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://ai-customer-support-saas-qf3x.onrender.com') + '/api';

export const fetchConversations = async (): Promise<Conversation[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${API_BASE}/conversations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
};

export const fetchTickets = async (): Promise<Ticket[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${API_BASE}/tickets`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
};
