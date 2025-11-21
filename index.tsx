import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

// Debugging
console.log(`React Version: ${React.version}`);

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  // Utilisation de createRoot nommé, plus sûr avec les modules ESM
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Masquer le loader une fois monté avec succès (sécurité supplémentaire)
  const loader = document.getElementById('loader-spinner');
  if (loader) loader.style.display = 'none';
  
} catch (error) {
  console.error("Failed to mount React app:", error);
  // Fallback error UI injected directly into DOM if React fails completely
  rootElement.innerHTML = `
    <div style="color: #ef4444; padding: 20px; text-align: center; font-family: sans-serif;">
      <h1>System Error</h1>
      <p>Failed to initialize the application core.</p>
      <pre style="background: #333; padding: 10px; border-radius: 4px; margin-top: 10px; text-align: left; overflow: auto; font-size: 12px;">${(error as Error).message}</pre>
    </div>
  `;
}