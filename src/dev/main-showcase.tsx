import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';
import { Showcase } from './Showcase.tsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Showcase />
  </StrictMode>,
);
