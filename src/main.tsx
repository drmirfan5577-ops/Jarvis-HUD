import './index.css';
import JarvisHUD from './components/JarvisHUD';

function App() {
  return <JarvisHUD />;
}

// Mount the app
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
