import React from 'react';
import ReactDOM from 'react-dom/client'; 

import App from './App';
import './i18n';

console.log('🚀 [index.js] Iniciando aplicação...');
console.log('🚀 [index.js] React version:', React.version);

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('🚀 [index.js] Root criado, renderizando App...');

root.render(<App />);

console.log('✅ [index.js] App renderizado!');
