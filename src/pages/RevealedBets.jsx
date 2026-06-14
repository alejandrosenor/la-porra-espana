import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function RevealedBets() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [match, setMatch] = useState(null)
    const [bets, setBets] = useState([])

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

        if (betsError) {
            console.log(betsError)
            alert('Error cargando apuestas')
            return
        }

        setMatch(matchData)
        setBets(betsData)
    }

    if (!match) return <h1>Cargando...</h1>

    return (
        <main className="revealed-page">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>Apuestas reveladas</h1>
            </header>

            <section className="revealed-summary">
                <p>{match.stage}</p>

                <h2>
                    🇪🇸 España {match.spain_goals} - {match.rival_goals} {match.rival_flag} {match.rival}
                </h2>

                <span>
                    Partido cerrado
                </span>
            </section>

            <section className="revealed-list">
                {bets.map((bet) => (
                    <article className="revealed-card" key={bet.id}>
                        <div className="revealed-top">
                            <strong>
                                {bet.players?.avatar} {bet.players?.name}
                            </strong>

                            <span className={bet.points > 0 ? 'points-positive' : 'points-zero'}>
                                {bet.points} pts
                            </span>
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

                        {bet.result_message && (
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
        </main>
    )
}

export default RevealedBets