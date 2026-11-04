import { createRoot } from 'react-dom/client';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import App from './App.tsx';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.error('Unable to register the offline app worker.');
    });
  });
} else if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    const appWorkerUrl = new URL('/sw.js', window.location.origin).href;
    registrations
      .filter((registration) => registration.active?.scriptURL === appWorkerUrl)
      .forEach((registration) => void registration.unregister());
  });
}

createRoot(document.getElementById('root')!).render(<App />);
