import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import WorldCupCalendar from './pages/WorldCupCalendar'
import AdminWorldCupMatch from './pages/AdminWorldCupMatch'
import Rules from './pages/Rules'
import AdminBoardPost from './pages/AdminBoardPost'

function App() {

  useEffect(() => {
    function preventZoom(event) {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventZoom, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventZoom)
    }
  }, [])

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
      <Route path="/admin/create-match" element={<AdminCreateMatch />} />
      <Route path="/admin/create-player" element={<AdminCreatePlayer />} />
      <Route path="/admin/players" element={<AdminPlayers />} />
      <Route path="/admin/message" element={<AdminMessage />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/drinks/:id" element={<MatchDrinks />} />
      <Route path="/world-cup" element={<WorldCupCalendar />} />
      <Route path="/admin/world-cup-match/:id" element={<AdminWorldCupMatch />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/admin/board/new" element={<AdminBoardPost />} />
    </Routes>
  )
}

export default App
