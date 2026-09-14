import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { initializeDatabase } from './db/database'
import { router } from './router.tsx'

async function bootstrap() {
  await initializeDatabase()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

void bootstrap()
