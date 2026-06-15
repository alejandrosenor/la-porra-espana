import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Match from './pages/Match'
import Ranking from './pages/Ranking'
import AdminMatch from './pages/AdminMatch'
import RevealedBets from './pages/RevealedBets'
import Profile from './pages/Profile'
import AdminCreateMatch from './pages/AdminCreateMatch'
import AdminCreatePlayer from './pages/AdminCreatePlayer'
import AdminPlayers from './pages/AdminPlayers'
import AdminMessage from './pages/AdminMessage'
import AdminSettings from './pages/AdminSettings'
import Stats from './pages/Stats'
import MatchDrinks from './pages/MatchDrinks'

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
      <Route path="/admin/create-match" element={<AdminCreateMatch />}/>
      <Route path="/admin/create-player" element={<AdminCreatePlayer />} />
      <Route path="/admin/players" element={<AdminPlayers />} />
      <Route path="/admin/message" element={<AdminMessage />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/match/:id/drinks" element={<MatchDrinks />} />
    </Routes>
  )
}

export default App
