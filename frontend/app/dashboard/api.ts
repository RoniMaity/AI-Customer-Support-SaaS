export type Conversation = {
  id: string;
  session_id: string;
  customer_name: string | null;
  customer_email: string | null;
  is_human_takeover: boolean;
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
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`${API_BASE}/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export async function getConversationMessages(conversationId: string) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

export async function sendAdminReply(conversationId: string, message: string) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await fetch(`${API_BASE}/chat/admin/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId, message })
    });
    if (!response.ok) throw new Error('Failed to send reply');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false };
  }
}

export const fetchTickets = async (): Promise<Ticket[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${API_BASE}/tickets`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
};
