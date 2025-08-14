import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppV2 } from './v2/ui/AppV2.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppV2 />
  </StrictMode>,
)