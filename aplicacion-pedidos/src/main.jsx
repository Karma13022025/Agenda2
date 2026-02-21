import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 👇 1. Importamos el asistente que hace que la app funcione sin internet
import { registerSW } from 'virtual:pwa-register'

// 👇 2. Le decimos que se active inmediatamente en cuanto el celular abra la página
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)