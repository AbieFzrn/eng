import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Pastikan Tailwind di-import di sini

// (Opsional) Export service ke window untuk debugging seperti kodemu sebelumnya
import { ensureSignedIn } from './services/authService';
import { createRoom, joinRoom } from './services/roomService';
window.dbg = { ensureSignedIn, createRoom, joinRoom };

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);