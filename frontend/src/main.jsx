import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext';

// Redux Imports
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 1. Provide the Store to the App */}
    <Provider store={store}>
      {/* 2. Wait for Redux to load saved data from LocalStorage */}
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)