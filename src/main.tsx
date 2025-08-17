import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppV2 } from './v2/ui/AppV2.tsx'
import { HornDesignerUI } from './v2/ui/AppV21.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HornDesignerUI />
  </StrictMode>,
)