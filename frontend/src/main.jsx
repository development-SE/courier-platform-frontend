import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from './utils/storage'
import { auth } from './utils/auth'
import './app/index.css'
import App from './app/App'

// Initialize localStorage with seed data
storage.initializeSeed()
auth.initialize()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
