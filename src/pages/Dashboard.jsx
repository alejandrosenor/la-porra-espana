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

    function isBettingNotOpenYet(match) {
        const now = new Date()
        const matchDate = new Date(match.match_date + 'Z')
        const openingDate = new Date(matchDate)
        openingDate.setDate(openingDate.getDate() - 2)
        return now < openingDate
    }

    function getMatchStatus(match, betDone, notOpenYet) {
        if (match.status === 'closed') return 'Partido cerrado'
        if (allPlayersHaveBet(match.id)) return 'Apuestas reveladas'
        if (betDone) return 'Apostado'
        if (isBettingClosed(match)) return 'Apuestas cerradas'
        if (notOpenYet) return 'Próximamente'
        return 'Pendiente'
    }

    function getMissingPlayers(matchId) {
        const betsForMatch = allBets.filter(
            (bet) => bet.match_id === matchId
        )

        const playerIdsWhoBet = betsForMatch.map(
            (bet) => bet.player_id
        )

        return players.filter(
            (player) => !playerIdsWhoBet.includes(player.id)
        )
    }

    const nextMatch = matches.find((match) => match.status !== 'closed')

    return (
        <main className="dashboard-page dashboard-home with-bottom-nav">
            <section className="home-hero">
                <div>
                    <p className="home-kicker">La Porra de España</p>
                    <h1>
                        {player?.avatar} {player?.name}
                    </h1>
                </div>

                <button
                    className="hero-ranking-button"
                    onClick={() => navigate('/ranking')}
                >
                    🏆 Ranking
                </button>
            </section>

            {nextMatch && (
                <section className="next-match-card">
                    <p className="next-label">Próximo partido</p>

                    <h2>
                        🇪🇸 España vs {nextMatch.rival_flag} {nextMatch.rival}
                    </h2>

                    <p className="next-date">
                        {new Date(nextMatch.match_date + 'Z').toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </section>
            )}

            <section className="matches-section pretty-matches">
                <div className="section-title-row">
                    <h2>Partidos</h2>
                    <span>{matches.length} partidos</span>
                </div>

                {matches.map((match) => {
                    const betDone = hasBet(match.id)
                    const bettingClosed = isBettingClosed(match)
                    const revealed = allPlayersHaveBet(match.id)
                    const notOpenYet = isBettingNotOpenYet(match)
                    const statusText = getMatchStatus(match, betDone, notOpenYet)
                    const missingBets = players.length - getBetsCount(match.id)
                    const missingPlayers = getMissingPlayers(match.id)

                    return (
                        <article key={match.id} className="pretty-match-card">
                            <div className="pretty-match-main">
                                {match.stage && (
                                    <p className="match-stage">🏆 {match.stage}</p>
                                )}

                                <h3>
                                    <span>🇪🇸 España</span>
                                    <small>vs</small>
                                    <span>{match.rival_flag} {match.rival}</span>
                                </h3>

                                <p className="match-date">
                                    {new Date(match.match_date + 'Z').toLocaleString('es-ES', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>

                                {!revealed && match.status !== 'closed' && (
                                    <p className="missing-bets">
                                        {missingPlayers.length === 0
                                            ? '✅ Todos han apostado'
                                            : `Faltan ${missingPlayers.map(p => p.name).join(', ')} por apostar`}
                                    </p>
                                )}
                            </div>

                            <div className="match-actions pretty-actions">
                                <span
                                    className={
                                        match.status === 'closed'
                                            ? 'status closed-status'
                                            : revealed
                                                ? 'status done'
                                                : betDone
                                                    ? 'status done'
                                                    : bettingClosed || notOpenYet
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
                                    <button disabled>Cerradas</button>
                                ) : notOpenYet ? (
                                    <button disabled>Próximamente</button>
                                ) : (
                                    <button onClick={() => navigate(`/match/${match.id}`)}>
                                        Apostar
                                    </button>
                                )}

                                {player?.is_admin && (
                                    <button
                                        className="admin-mini-button"
                                        onClick={() => navigate(`/admin/match/${match.id}`)}
                                    >
                                        Admin
                                    </button>
                                )}
                            </div>
                        </article>
                    )
                })}
            </section>

            <BottomNav />
        </main>
    )
}

export default Dashboard