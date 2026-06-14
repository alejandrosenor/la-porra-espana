import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function Match() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [match, setMatch] = useState(null)
    const [existingBet, setExistingBet] = useState(null)
    const [winner, setWinner] = useState('')
    const [spainGoals, setSpainGoals] = useState(0)
    const [rivalGoals, setRivalGoals] = useState(0)
    const [timeLeft, setTimeLeft] = useState('Calculando...')
    const [isClosed, setIsClosed] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!match) return

        updateCountdown()

        const interval = setInterval(() => {
            updateCountdown()
        }, 1000)

        return () => clearInterval(interval)
    }, [match])

    async function loadData() {
        const player = JSON.parse(localStorage.getItem('player'))

        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single()

        if (matchError) {
            console.log(matchError)
            alert('Error cargando el partido')
            navigate('/dashboard')
            return
        }

        const { data: betData } = await supabase
            .from('bets')
            .select('*')
            .eq('player_id', player.id)
            .eq('match_id', id)
            .maybeSingle()

        setMatch(matchData)

        if (betData) {
            setExistingBet(betData)
            setWinner(betData.winner)
            setSpainGoals(betData.spain_goals)
            setRivalGoals(betData.rival_goals)
        }
    }

    function updateCountdown() {
        const now = new Date()
        const closingDate = new Date(match.closing_date + 'Z')
        const difference = closingDate - now

        if (difference <= 0 || match.status === 'closed') {
            setTimeLeft('Apuestas cerradas')
            setIsClosed(true)
            return
        }

        const totalSeconds = Math.floor(difference / 1000)

        const days = Math.floor(totalSeconds / (60 * 60 * 24))
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
        const seconds = totalSeconds % 60

        setTimeLeft(`${days}d · ${hours}h · ${minutes}m · ${seconds}s`)
        setIsClosed(false)
    }

    function isBettingNotOpenYet() {
        const now = new Date()
        const matchDate = new Date(match.match_date + 'Z')
        const openingDate = new Date(matchDate)

        openingDate.setDate(openingDate.getDate() - 2)

        return now < openingDate
    }

    const isValidBet = () => {
        if (!winner) return false
        if (winner === 'Empate') return spainGoals === rivalGoals
        if (winner === 'España') return spainGoals > rivalGoals
        return rivalGoals > spainGoals
    }

    const saveBet = async () => {
        if (isClosed) {
            alert('Las apuestas para este partido ya están cerradas')
            return
        }

        if (!isValidBet()) {
            alert('El resultado no coincide con el ganador elegido')
            return
        }

        const player = JSON.parse(localStorage.getItem('player'))

        const { error } = await supabase.from('bets').insert({
            player_id: player.id,
            match_id: match.id,
            winner,
            spain_goals: spainGoals,
            rival_goals: rivalGoals
        })

        if (error) {
            console.log(error)
            alert('Error guardando apuesta')
            return
        }

        alert('Apuesta guardada 🔥')
        navigate('/dashboard')
    }

    if (!match) return <h1>Cargando...</h1>

    const notOpenYet = isBettingNotOpenYet()
    const locked = !!existingBet || isClosed || notOpenYet

    return (
        <main className="match-page">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>España vs {match.rival}</h1>
            </header>

            <section className="bet-card">
                {existingBet && (
                    <p className="bet-warning">
                        🔒 Ya has apostado este partido. Tu apuesta queda bloqueada.
                    </p>
                )}

                {isClosed && !existingBet && (
                    <p className="bet-warning">
                        ⏰ Las apuestas para este partido ya están cerradas.
                    </p>
                )}

                {notOpenYet && !existingBet && (
                    <p className="bet-warning">
                        🔒 Las apuestas para este partido todavía no están abiertas.
                    </p>
                )}

                <p className="closing-text">La apuesta se cierra en:</p>
                <strong className={isClosed ? 'countdown closed' : 'countdown'}>
                    {timeLeft}
                </strong>

                <h2>¿Quién ganará?</h2>

                <div className="winner-options">
                    <button
                        disabled={locked}
                        className={winner === 'España' ? 'selected' : ''}
                        onClick={() => setWinner('España')}
                    >
                        🇪🇸 España
                    </button>

                    <button
                        disabled={locked}
                        className={winner === 'Empate' ? 'selected' : ''}
                        onClick={() => setWinner('Empate')}
                    >
                        🤝 Empate
                    </button>

                    <button
                        disabled={locked}
                        className={winner === match.rival ? 'selected' : ''}
                        onClick={() => setWinner(match.rival)}
                    >
                        {match.rival_flag} {match.rival}
                    </button>
                </div>

                <h2>Resultado exacto</h2>

                <div className="score-picker">
                    <button
                        disabled={locked}
                        onClick={() => setSpainGoals(Math.max(0, spainGoals - 1))}
                    >
                        −
                    </button>

                    <span>{spainGoals}</span>

                    <button
                        disabled={locked}
                        onClick={() => setSpainGoals(spainGoals + 1)}
                    >
                        +
                    </button>

                    <strong>-</strong>

                    <button
                        disabled={locked}
                        onClick={() => setRivalGoals(Math.max(0, rivalGoals - 1))}
                    >
                        −
                    </button>

                    <span>{rivalGoals}</span>

                    <button
                        disabled={locked}
                        onClick={() => setRivalGoals(rivalGoals + 1)}
                    >
                        +
                    </button>
                </div>

                {!isValidBet() && winner && !locked && (
                    <p className="bet-warning">
                        ⚠️ El resultado no coincide con el ganador seleccionado.
                    </p>
                )}

                <p className="rules">
                    Acertar ganador: +3 puntos<br />
                    Acertar resultado exacto: +5 puntos
                </p>

                {!existingBet && !isClosed && !notOpenYet && (
                    <button
                        className="save-bet"
                        onClick={saveBet}
                        disabled={!isValidBet()}
                    >
                        Guardar apuesta
                    </button>
                )}
            </section>
        </main>
    )
}

export default Match