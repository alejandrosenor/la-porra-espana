import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function RevealedBets() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [match, setMatch] = useState(null)
    const [bets, setBets] = useState([])
    const [players, setPlayers] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single()

        if (matchError) {
            console.log(matchError)
            alert('Error cargando partido')
            navigate('/dashboard')
            return
        }

        const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select(`
        *,
        players (
          name,
          avatar
        )
      `)
            .eq('match_id', id)
            .order('points', { ascending: false })

        const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*')

        if (betsError || playersError) {
            console.log(betsError || playersError)
            alert('Error cargando apuestas')
            return
        }

        setMatch(matchData)
        setBets(betsData || [])
        setPlayers(playersData || [])
    }

    if (!match) return <h1>Cargando...</h1>

    const allPlayersHaveBet = players.length > 0 && bets.length === players.length
    const missingBets = players.length - bets.length
    const isClosed = match.status === 'closed'
    const canReveal = allPlayersHaveBet || isClosed

    if (!canReveal) {
        return (
            <main className="revealed-page with-bottom-nav">
                <header className="match-header">
                    <button onClick={() => navigate('/dashboard')}>←</button>
                    <h1>Apuestas ocultas</h1>
                </header>

                <section className="revealed-summary">
                    <p>{match.stage}</p>

                    <h2>
                        🇪🇸 España vs {match.rival_flag} {match.rival}
                    </h2>

                    <span className="hidden-bets-pill">
                        Faltan {missingBets} por apostar
                    </span>
                </section>

                <section className="hidden-bets-card">
                    <h2>🔒 Apuestas todavía ocultas</h2>
                    <p>
                        Las apuestas se revelarán automáticamente cuando todos los jugadores hayan apostado.
                    </p>
                </section>

                <BottomNav />
            </main>
        )
    }

    return (
        <main className="revealed-page with-bottom-nav">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>{isClosed ? 'Resultados' : 'Apuestas reveladas'}</h1>
            </header>

            <section className="revealed-summary">
                <p>{match.stage}</p>

                {isClosed ? (
                    <h2>
                        🇪🇸 España {match.spain_goals} - {match.rival_goals} {match.rival_flag} {match.rival}
                    </h2>
                ) : (
                    <h2>
                        🇪🇸 España vs {match.rival_flag} {match.rival}
                    </h2>
                )}

                <span>
                    {isClosed
                        ? 'Partido cerrado'
                        : 'Todos han apostado'}
                </span>
            </section>

            <section className="revealed-list">
                {bets.map((bet) => (
                    <article className="revealed-card" key={bet.id}>
                        <div className="revealed-top">
                            <strong>
                                {bet.players?.avatar} {bet.players?.name}
                            </strong>

                            {isClosed ? (
                                <span className={bet.points > 0 ? 'points-positive' : 'points-zero'}>
                                    {bet.points} pts
                                </span>
                            ) : (
                                <span className="pending-points">
                                    Puntos pendientes
                                </span>
                            )}
                        </div>

                        <div className="revealed-bet">
                            <p>Ganador apostado</p>
                            <strong>{bet.winner}</strong>
                        </div>

                        <div className="revealed-score">
                            <p>Resultado apostado</p>
                            <strong>
                                España {bet.spain_goals} - {bet.rival_goals} {match.rival}
                            </strong>
                        </div>

                        {isClosed && bet.result_message && (
                            <p
                                className={
                                    bet.points > 0
                                        ? 'ranking-message-positive'
                                        : 'ranking-message-negative'
                                }
                            >
                                {bet.result_message}
                            </p>
                        )}
                    </article>
                ))}
            </section>

            <BottomNav />
        </main>
    )
}

export default RevealedBets