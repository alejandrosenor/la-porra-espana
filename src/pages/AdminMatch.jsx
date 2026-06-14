import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminMatch() {
    const navigate = useNavigate()
    const { id } = useParams()

    const player = JSON.parse(localStorage.getItem('player'))

    const [match, setMatch] = useState(null)
    const [spainGoals, setSpainGoals] = useState(0)
    const [rivalGoals, setRivalGoals] = useState(0)

    useEffect(() => {
        if (!player?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadMatch()
    }, [])

    async function loadMatch() {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.log(error)
            alert('Error cargando partido')
            navigate('/dashboard')
            return
        }

        setMatch(data)

        if (data.spain_goals !== null) setSpainGoals(data.spain_goals)
        if (data.rival_goals !== null) setRivalGoals(data.rival_goals)
    }

    function getRealWinner() {
        if (spainGoals === rivalGoals) return 'Empate'
        if (spainGoals > rivalGoals) return 'España'
        return match.rival
    }

    function calculatePoints(bet) {
        let points = 0

        const winnerHit = bet.winner === getRealWinner()
        const exactHit =
            bet.spain_goals === spainGoals &&
            bet.rival_goals === rivalGoals

        if (winnerHit) points += 3
        if (exactHit) points += 5

        return points
    }

    function buildResultMessage(bet) {
        const winnerHit = bet.winner === getRealWinner()
        const exactHit =
            bet.spain_goals === spainGoals &&
            bet.rival_goals === rivalGoals

        let message = ''

        if (winnerHit) {
            message += `🟢 +3 Acertó ganador (${getRealWinner()}). `
        } else {
            message += `🔴 No acertó ganador. Apostó ${bet.winner}. `
        }

        if (exactHit) {
            message += `🟢 +5 Clavó el resultado exacto (${spainGoals}-${rivalGoals}).`
        } else {
            message += `🔴 Falló el resultado exacto. Apostó ${bet.spain_goals}-${bet.rival_goals}.`
        }

        return message
    }

    async function closeMatch() {
        if (!player?.is_admin) {
            alert('No tienes permisos para cerrar partidos')
            navigate('/dashboard')
            return
        }

        if (match.status === 'closed') {
            alert('Este partido ya está cerrado. No se pueden volver a sumar puntos.')
            return
        }

        const confirmed = confirm('¿Seguro que quieres cerrar el partido y calcular puntos?')

        if (!confirmed) return

        const { data: bets, error: betsError } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id)

        if (betsError) {
            console.log(betsError)
            alert('Error leyendo apuestas')
            return
        }

        for (const bet of bets) {
            const points = calculatePoints(bet)
            const resultMessage = buildResultMessage(bet)

            const winnerHit = bet.winner === getRealWinner()
            const exactHit =
                bet.spain_goals === spainGoals &&
                bet.rival_goals === rivalGoals

            await supabase
                .from('bets')
                .update({
                    points,
                    result_message: resultMessage
                })
                .eq('id', bet.id)

            const { data: playerData } = await supabase
                .from('players')
                .select('*')
                .eq('id', bet.player_id)
                .single()

            await supabase
                .from('players')
                .update({
                    points: playerData.points + points,
                    winner_hits: playerData.winner_hits + (winnerHit ? 1 : 0),
                    exact_hits: playerData.exact_hits + (exactHit ? 1 : 0)
                })
                .eq('id', playerData.id)
        }

        await supabase
            .from('matches')
            .update({
                spain_goals: spainGoals,
                rival_goals: rivalGoals,
                status: 'closed'
            })
            .eq('id', id)

        alert('Partido cerrado y puntos calculados 🏆')
        navigate('/ranking')
    }

    if (!player?.is_admin) return null
    if (!match) return <h1>Cargando...</h1>

    return (
        <main className="match-page">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>Admin resultado</h1>
            </header>

            <section className="bet-card">
                <h2>🇪🇸 España vs {match.rival_flag} {match.rival}</h2>

                {match.status === 'closed' && (
                    <p className="bet-warning">
                        🔒 Este partido ya está cerrado.
                    </p>
                )}

                <p className="closing-text">Resultado real</p>

                <div className="score-picker">
                    <button
                        disabled={match.status === 'closed'}
                        onClick={() => setSpainGoals(Math.max(0, spainGoals - 1))}
                    >
                        −
                    </button>

                    <span>{spainGoals}</span>

                    <button
                        disabled={match.status === 'closed'}
                        onClick={() => setSpainGoals(spainGoals + 1)}
                    >
                        +
                    </button>

                    <strong>-</strong>

                    <button
                        disabled={match.status === 'closed'}
                        onClick={() => setRivalGoals(Math.max(0, rivalGoals - 1))}
                    >
                        −
                    </button>

                    <span>{rivalGoals}</span>

                    <button
                        disabled={match.status === 'closed'}
                        onClick={() => setRivalGoals(rivalGoals + 1)}
                    >
                        +
                    </button>
                </div>

                <p className="rules">
                    Ganador real: <strong>{getRealWinner()}</strong>
                </p>

                <button
                    className="save-bet"
                    onClick={closeMatch}
                    disabled={match.status === 'closed'}
                >
                    Cerrar partido y calcular puntos
                </button>
            </section>
        </main>
    )
}

export default AdminMatch