import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Basic inline styles to keep the widget simple and standalone
const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    fontFamily: 'sans-serif',
  },
  button: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBox: {
    position: 'absolute' as const,
    bottom: '80px',
    right: '0',
    width: '350px',
    height: '500px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0070f3',
    color: 'white',
    padding: '16px',
    margin: 0,
    fontSize: '18px',
  },
  messagesArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    backgroundColor: '#f9f9f9',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '8px',
    maxWidth: '85%',
    lineHeight: '1.4',
  },
  userMessage: {
    backgroundColor: '#0070f3',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '0',
  },
  botMessage: {
    backgroundColor: '#e5e5ea',
    color: 'black',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '0',
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '20px',
    outline: 'none',
    fontSize: '14px',
  },
  sendBtn: {
    marginLeft: '8px',
    padding: '10px 16px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }
};

type Message = {
  id: number;
  sender: 'user' | 'bot' | 'admin';
  text: string;
};

export default function ChatWidget({ apiUrl = 'https://ai-customer-support-saas-qf3x.onrender.com/api/chat', tenantApiKey = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [conversationId] = useState(() => {
    // Generate a simple unique ID for this chat session
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Socket.io connection for live handoff chat
  useEffect(() => {
    const backendUrl = new URL(apiUrl).origin;
    const socket = io(backendUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_conversation', conversationId);
    });

    socket.on('admin_message', (data: { id: number, sender: 'admin', text: string }) => {
      setIsLiveChat(true);
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, conversationId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newMessageId = Date.now();
    
    // Optimistically add user message
    setMessages(prev => [...prev, { id: newMessageId, sender: 'user', text: userText }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tenantApiKey
        },
        body: JSON.stringify({ query: userText, conversationId })
      });

      // Handle JSON response for when handoff is active
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (json.status === 'sent_to_agent') {
          setIsLiveChat(true);
          // Do nothing. Wait for 'admin_message' socket event.
          setIsLoading(false);
          return;
        }
      }

      if (!response.body) throw new Error('No response body');

      // Create an empty bot message to append streamed text to
      const botMessageId = newMessageId + 1;
      setMessages(prev => [...prev, { id: botMessageId, sender: 'bot', text: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Update the bot message with the incoming chunk
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: msg.text + chunk } : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {isOpen && (
        <div style={styles.chatBox}>
          <h3 style={styles.header}>
            Support Chat
            {isLiveChat && (
              <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: '#ffd700', color: '#856404', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold' }}>
                Live Agent Connected
              </span>
            )}
          </h3>
          
          <div style={styles.messagesArea}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{
                  ...styles.message, 
                  ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage)
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && <div style={{...styles.message, ...styles.botMessage}}>Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputArea}>
            <input 
              style={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button style={styles.sendBtn} onClick={handleSend} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      )}

      <button style={styles.button} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
