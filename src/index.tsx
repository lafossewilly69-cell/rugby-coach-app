import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Connexion from './Connexion';
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Connexion><App /></Connexion></React.StrictMode>);
