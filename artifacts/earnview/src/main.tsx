import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// In production (Netlify), VITE_API_URL points to the Render backend.
// In development (Replit), it is not set and relative /api/* paths work fine.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL as string);
}

createRoot(document.getElementById('root')!).render(<App />);
