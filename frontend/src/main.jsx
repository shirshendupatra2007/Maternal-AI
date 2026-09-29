import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 248, 252, 0.96)',
          color: '#3d2145',
          border: '1px solid rgba(232, 99, 154, 0.25)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(155, 114, 207, 0.15)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '0.88rem'
        }
      }}
    />
  </React.StrictMode>
)
