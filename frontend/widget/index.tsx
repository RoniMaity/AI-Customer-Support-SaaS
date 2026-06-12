import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

// This is the entry point for compiling the embeddable widget
// Webpack or Vite will bundle this into a single "widget.js" file.

// Usage in an external site:
// <script src="https://your-saas.com/widget.js" data-tenant-token="YOUR_TOKEN"></script>

const initWidget = () => {
  // Find the currently executing script to read data attributes if needed
  const scriptTag = document.currentScript as HTMLScriptElement;
  const tenantToken = scriptTag?.getAttribute('data-tenant-token') || '';
  
  // You can also read apiUrl from data attribute, or default to production URL
  const apiUrl = scriptTag?.getAttribute('data-api-url') || 'http://localhost:3000/api/chat';

  // Create a container div for our React app
  const container = document.createElement('div');
  container.id = 'ai-support-widget-root';
  document.body.appendChild(container);

  // Mount the React component
  const root = createRoot(container);
  root.render(<ChatWidget apiUrl={apiUrl} tenantApiKey={tenantToken} />);
};

// Ensure DOM is fully loaded before injecting the widget
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initWidget();
} else {
  document.addEventListener('DOMContentLoaded', initWidget);
}
