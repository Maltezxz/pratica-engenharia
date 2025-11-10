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
          console.log('[App] Service Worker registrado com sucesso');

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] Nova versão disponível!');
                  showUpdateNotification(registration);
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.warn('⚠ Falha ao registrar Service Worker:', registrationError);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log(`[App] Service Worker atualizado para versão ${event.data.version}`);
        }
      });
    });
  }

  function showUpdateNotification(registration: ServiceWorkerRegistration) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1A5276 0%, #2874A6 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; font-size: 15px; margin-bottom: 8px;';
    title.textContent = 'Nova versão disponível';

    const message = document.createElement('div');
    message.style.cssText = 'font-size: 13px; margin-bottom: 12px; opacity: 0.95;';
    message.textContent = 'Clique em "Atualizar" para carregar a versão mais recente.';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Atualizar';
    updateButton.style.cssText = `
      background: white;
      color: #1A5276;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: transform 0.1s;
    `;
    updateButton.onmouseover = () => {
      updateButton.style.transform = 'scale(1.05)';
    };
    updateButton.onmouseout = () => {
      updateButton.style.transform = 'scale(1)';
    };
    updateButton.onclick = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      notification.remove();
    };

    const dismissButton = document.createElement('button');
    dismissButton.textContent = 'Depois';
    dismissButton.style.cssText = `
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    dismissButton.onmouseover = () => {
      dismissButton.style.background = 'rgba(255, 255, 255, 0.1)';
    };
    dismissButton.onmouseout = () => {
      dismissButton.style.background = 'transparent';
    };
    dismissButton.onclick = () => {
      notification.remove();
    };

    buttonContainer.appendChild(updateButton);
    buttonContainer.appendChild(dismissButton);

    notification.appendChild(title);
    notification.appendChild(message);
    notification.appendChild(buttonContainer);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
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
