import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Dashboard() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [matches, setMatches] = useState([])
    const [myBets, setMyBets] = useState([])
    const [allBets, setAllBets] = useState([])
    const [players, setPlayers] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: matchesData } = await supabase
            .from('matches')
            .select('*')
            .order('match_order')

        const { data: myBetsData } = await supabase
            .from('bets')
            .select('*')
            .eq('player_id', player.id)

        const { data: allBetsData } = await supabase
            .from('bets')
            .select('*')

        const { data: playersData } = await supabase
            .from('players')
            .select('*')

        setMatches(matchesData || [])
        setMyBets(myBetsData || [])
        setAllBets(allBetsData || [])
        setPlayers(playersData || [])
    }

    function hasBet(matchId) {
        return myBets.some((bet) => bet.match_id === matchId)
    }

    function getBetsCount(matchId) {
        return allBets.filter((bet) => bet.match_id === matchId).length
    }

    function allPlayersHaveBet(matchId) {
        return players.length > 0 && getBetsCount(matchId) === players.length
    }

    function isBettingClosed(match) {
        if (match.status === 'closed') return true

        const now = new Date()
        const closingDate = new Date(match.closing_date + 'Z')

        return closingDate <= now
    }

    function getMatchStatus(match, betDone, notOpenYet) {
        if (match.status === 'closed') return 'Partido cerrado'
        if (allPlayersHaveBet(match.id)) return 'Apuestas reveladas'
        if (betDone) return 'Apostado'
        if (isBettingClosed(match)) return 'Apuestas cerradas'
        if (notOpenYet) return 'Próximamente'
        return 'Pendiente'
    }

    function isBettingNotOpenYet(match) {
        const now = new Date()
        const matchDate = new Date(match.match_date + 'Z')
        const openingDate = new Date(matchDate)

        openingDate.setDate(openingDate.getDate() - 2)

        return now < openingDate
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
                    const revealed = allPlayersHaveBet(match.id)
                    const notOpenYet = isBettingNotOpenYet(match)
                    const statusText = getMatchStatus(match, betDone)
                    const missingBets = players.length - getBetsCount(match.id)

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
                                    {new Date(match.match_date + 'Z').toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>

                                {!revealed && match.status !== 'closed' && (
                                    <p className="missing-bets">
                                        Faltan {missingBets} por apostar
                                    </p>
                                )}
                            </div>

                            <div className="match-actions">
                                <span
                                    className={
                                        match.status === 'closed'
                                            ? 'status closed-status'
                                            : revealed
                                                ? 'status done'
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
                                        Ver resultados
                                    </button>
                                ) : revealed ? (
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
                                ) : notOpenYet ? (
                                    <button disabled>
                                        Próximamente
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