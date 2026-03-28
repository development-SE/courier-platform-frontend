import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from './utils/storage'
import './app/index.css'
import App from './app/App'

storage.initializeSeed()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)