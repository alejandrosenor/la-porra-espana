import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Dashboard() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [matches, setMatches] = useState([])
    const [bets, setBets] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select('*')
            .order('match_date')

        const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select('*')
            .eq('player_id', player.id)

        if (matchesError || betsError) {
            console.log(matchesError || betsError)
            return
        }

        setMatches(matchesData)
        setBets(betsData)
    }

    function hasBet(matchId) {
        return bets.some((bet) => bet.match_id === matchId)
    }

    function isBettingClosed(match) {
        if (match.status === 'closed') return true

        const now = new Date()
        const closingDate = new Date(match.closing_date + 'Z')

        return closingDate <= now
    }

    function getMatchStatus(match, betDone) {
        if (match.status === 'closed') return 'Partido cerrado'
        if (betDone) return 'Apostado'
        if (isBettingClosed(match)) return 'Apuestas cerradas'
        return 'Pendiente'
    }

    return (
        <main className="dashboard-page with-bottom-nav">
            <header className="dashboard-header">
                <h1>🇪🇸 La Porra de España</h1>

                <p>
                    Bienvenido, {player?.avatar} {player?.name}
                </p>

                <button
                    className="ranking-button"
                    onClick={() => navigate('/ranking')}
                >
                    Ver ranking 🏆
                </button>
            </header>

            <section className="matches-section">
                <h2>Partidos</h2>

                {matches.map((match) => {
                    const betDone = hasBet(match.id)
                    const bettingClosed = isBettingClosed(match)
                    const statusText = getMatchStatus(match, betDone)

                    return (
                        <div key={match.id} className="match-card">
                            <div>
                                {match.stage && (
                                    <p className="match-stage">
                                        🏆 {match.stage}
                                    </p>
                                )}

                                <strong>
                                    🇪🇸 España vs {match.rival_flag} {match.rival}
                                </strong>

                                <p>
                                    {new Date(match.match_date + 'Z').toLocaleString()}
                                </p>
                            </div>

                            <div className="match-actions">
                                <span
                                    className={
                                        match.status === 'closed'
                                            ? 'status closed-status'
                                            : betDone
                                                ? 'status done'
                                                : bettingClosed
                                                    ? 'status closed-status'
                                                    : 'status'
                                    }
                                >
                                    {statusText}
                                </span>

                                {match.status === 'closed' ? (
                                    <button onClick={() => navigate(`/match/${match.id}/bets`)}>
                                        Ver apuestas
                                    </button>
                                ) : betDone ? (
                                    <button onClick={() => navigate(`/match/${match.id}`)}>
                                        Ver apuesta
                                    </button>
                                ) : bettingClosed ? (
                                    <button disabled>
                                        Cerradas
                                    </button>
                                ) : (
                                    <button onClick={() => navigate(`/match/${match.id}`)}>
                                        Apostar
                                    </button>
                                )}

                                {player?.is_admin && (
                                    <button onClick={() => navigate(`/admin/match/${match.id}`)}>
                                        Admin
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </section>
            <BottomNav />
        </main>
    )
}

export default Dashboard