import React from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import App from './App';

const root = createRoot(document.getElementById('app'));
root.render(<App />);
