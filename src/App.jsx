import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Match from './pages/Match'
import Ranking from './pages/Ranking'
import AdminMatch from './pages/AdminMatch'
import RevealedBets from './pages/RevealedBets'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/match/:id" element={<Match />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/admin/match/:id" element={<AdminMatch />} />
      <Route path="/match/:id/bets" element={<RevealedBets />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default App
