import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { StudyProvider } from './context/StudyContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <StudyProvider>
        <App />
      </StudyProvider>
    </AuthProvider>
  </React.StrictMode>,
)