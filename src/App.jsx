import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Terms from './pages/TPR/Terms'       // Import-en ti Terms component
import Privacy from './pages/TPR/Privacy'   // Import-en ti Privacy component
import Refund from './pages/TPR/Refund'     // Import-en ti Refund component
import { ProtectedRoute } from './utils/ProtectedRoute'
import { PublicRoute } from './utils/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AuthProvider>
        <Routes>
          {/* Logged in user hi Home dekh sakta hai */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          {/* Logged in user /auth par nahi ja sakta */}
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />

          {/* Public Policy Pages (Awan ti ProtectedRoute tapno makita ti amin ken ni Razorpay) */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default App