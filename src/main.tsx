import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

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
