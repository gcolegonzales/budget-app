import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import 'react-calendar/dist/Calendar.css'
import './index.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
