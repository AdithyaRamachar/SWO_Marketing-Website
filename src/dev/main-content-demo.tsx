import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';
import { ContentDemo } from './ContentDemo.tsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ContentDemo />
  </StrictMode>,
);
