import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { installErrorReporter } from './lib/errorReporter'

installErrorReporter();

// После обновления сайта старые чанки пропадают — один раз перезагружаем страницу
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    if (sessionStorage.getItem('chunk_reload') !== '1') {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  } catch { /* ignore */ }
});

createRoot(document.getElementById("root")!).render(<App />);

// Регистрация Service Worker — откладываем на idle,
// чтобы не конкурировать с первым рендером главной страницы
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  };
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(registerSW, { timeout: 5000 });
  } else {
    window.addEventListener('load', () => setTimeout(registerSW, 3000));
  }
}
