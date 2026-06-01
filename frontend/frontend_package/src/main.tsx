// Suppress benign WebSocket/HMR connection errors in the sandbox development environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || '';
    const stack = event.reason?.stack || '';
    if (
      msg.includes('WebSocket') || 
      msg.includes('websocket') ||
      msg.includes('WebSocket closed without opened') ||
      stack.includes('vite/dist/client')
    ) {
      event.preventDefault();
      console.warn('[Mental Health Care Dev Suppressed]: WebSocket HMR connection issue (expected in sandbox proxy environments).', event.reason);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') || 
      msg.includes('websocket') ||
      msg.includes('WebSocket closed without opened')
    ) {
      event.preventDefault();
      console.warn('[Mental Health Care Dev Suppressed]: WebSocket HMR generic error (expected in sandbox proxy environments).');
    }
  });
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
