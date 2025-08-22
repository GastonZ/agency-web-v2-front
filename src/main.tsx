import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './routes/AppRouter.tsx'
import './i18n/i18n.js'
import { AuthProvider } from './context/AuthContext.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
