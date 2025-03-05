import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Add Buffer polyfill for the browser
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
  
  console.log('LaserEyes SDK Demo initialized with Buffer polyfill!');
});