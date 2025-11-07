import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug: Log initialization

// Check environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗');

  // Show error to user (using safe DOM creation)
  const root = document.getElementById('root');
  if (root) {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 40px; font-family: system-ui; text-align: center;';

    const h1 = document.createElement('h1');
    h1.style.color = '#e74c3c';
    h1.textContent = '⚠️ Erro de Configuração';

    const p1 = document.createElement('p');
    p1.style.color = '#666';
    p1.textContent = 'As variáveis de ambiente não estão configuradas.';

    const p2 = document.createElement('p');
    p2.style.color = '#666';
    p2.textContent = 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no servidor de deploy.';

    const hr = document.createElement('hr');
    hr.style.cssText = 'margin: 30px 0; border: none; border-top: 1px solid #ddd;';

    const p3 = document.createElement('p');
    p3.style.cssText = 'font-size: 14px; color: #999;';
    p3.textContent = 'Para debug, acesse: ';
    const a = document.createElement('a');
    a.href = '/debug.html';
    a.textContent = '/debug.html';
    p3.appendChild(a);

    container.appendChild(h1);
    container.appendChild(p1);
    container.appendChild(p2);
    container.appendChild(hr);
    container.appendChild(p3);

    root.appendChild(container);
  }
} else {

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
        })
        .catch((registrationError) => {
          console.warn('⚠ Falha ao registrar Service Worker:', registrationError);
        });
    });
  }

  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Elemento #root não encontrado no DOM');
    }

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    const root = document.getElementById('root');
    if (root) {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 40px; font-family: system-ui; text-align: center;';

      const h1 = document.createElement('h1');
      h1.style.color = '#e74c3c';
      h1.textContent = '❌ Erro ao Inicializar';

      const p1 = document.createElement('p');
      p1.style.color = '#666';
      p1.textContent = error instanceof Error ? error.message : 'Erro desconhecido';

      const p2 = document.createElement('p');
      p2.style.cssText = 'font-size: 14px; color: #999;';
      p2.textContent = 'Abra o console (F12) para mais detalhes';

      const hr = document.createElement('hr');
      hr.style.cssText = 'margin: 30px 0; border: none; border-top: 1px solid #ddd;';

      const p3 = document.createElement('p');
      p3.style.cssText = 'font-size: 14px; color: #999;';
      p3.textContent = 'Para debug, acesse: ';
      const a = document.createElement('a');
      a.href = '/debug.html';
      a.textContent = '/debug.html';
      p3.appendChild(a);

      container.appendChild(h1);
      container.appendChild(p1);
      container.appendChild(p2);
      container.appendChild(hr);
      container.appendChild(p3);

      root.appendChild(container);
    }
  }
}
