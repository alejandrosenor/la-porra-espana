import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function Match() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [match, setMatch] = useState(null)
    const [existingBet, setExistingBet] = useState(null)
    const [totalPlayers, setTotalPlayers] = useState(0)
    const [totalBets, setTotalBets] = useState(0)

    const [winner, setWinner] = useState('')
    const [spainGoals, setSpainGoals] = useState(0)
    const [rivalGoals, setRivalGoals] = useState(0)
    const [timeLeft, setTimeLeft] = useState('Calculando...')
    const [isClosed, setIsClosed] = useState(false)
    const [allMatchBets, setAllMatchBets] = useState([])
    const [keyPlayer, setKeyPlayer] = useState('')
    const [qualifiedTeam, setQualifiedTeam] = useState('')

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

        const { data: playersData } = await supabase
            .from('players')
            .select('id')

        const { data: betsData } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id)

        setMatch(matchData)
        setTotalPlayers(playersData?.length || 0)
        setTotalBets(betsData?.length || 0)
        setAllMatchBets(betsData || [])

        if (betData) {
            setExistingBet(betData)
            setWinner(betData.winner)
            setSpainGoals(betData.spain_goals)
            setRivalGoals(betData.rival_goals)
            setKeyPlayer(betData.key_player || '')
            setQualifiedTeam(betData.qualified_team || '')
        }
    }

    function isKnockoutMatch() {
        return match?.stage && match.stage !== 'Fase de grupos'
    }

    function updateCountdown() {
        const now = new Date()
        const matchDate = new Date(match.match_date)

        const closingDate = new Date(matchDate)
        closingDate.setHours(closingDate.getHours() - 2)
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

    function getOpeningDate() {
        const matchDate = new Date(match.match_date)
        const openingDate = new Date(matchDate)

        openingDate.setDate(openingDate.getDate() - 2)

        return openingDate
    }

    function isBettingNotOpenYet() {
        const now = new Date()
        return now < getOpeningDate()
    }

    function allPlayersHaveBet() {
        return totalPlayers > 0 && totalBets >= totalPlayers
    }

    function allPlayersUsedEdit() {
        if (totalPlayers === 0) return false
        if (allMatchBets.length < totalPlayers) return false

        return allMatchBets.every((bet) => (bet.edit_count || 0) >= 1)
    }

    const isValidBet = () => {
        if (isKnockoutMatch()) {
            if (!qualifiedTeam) return false
            return true
        }

        if (!winner) return false
        if (winner === 'Empate') return spainGoals === rivalGoals
        if (winner === 'España') return spainGoals > rivalGoals
        return rivalGoals > spainGoals
    }

    function canEditBet() {
        if (!existingBet) return false
        if (isClosed) return false
        if (isBettingNotOpenYet()) return false
        if (allPlayersUsedEdit()) return false

        return (existingBet.edit_count || 0) < 1
    }

    const saveBet = async () => {
        if (isClosed) {
            alert('Las apuestas para este partido ya están cerradas')
            return
        }

        if (isBettingNotOpenYet()) {
            alert('Las apuestas para este partido todavía no están abiertas')
            return
        }

        if (!isValidBet()) {
            alert('El resultado no coincide con el ganador elegido')
            return
        }

        const player = JSON.parse(localStorage.getItem('player'))

        if (existingBet) {
            if (!canEditBet()) {
                alert('Ya no puedes editar esta apuesta')
                return
            }

            const { error } = await supabase
                .from('bets')
                .update({
                    winner,
                    spain_goals: spainGoals,
                    rival_goals: rivalGoals,
                    edit_count: (existingBet.edit_count || 0) + 1,
                    key_player: keyPlayer,
                    qualified_team: isKnockoutMatch() ? qualifiedTeam : null
                })
                .eq('id', existingBet.id)

            if (error) {
                console.log(error)
                alert('Error editando apuesta')
                return
            }

            alert('Apuesta editada. Ya no podrás volver a cambiarla 🔒')
            navigate('/dashboard')
            return
        }

        const { error } = await supabase.from('bets').insert({
            player_id: player.id,
            match_id: match.id,
            winner,
            spain_goals: spainGoals,
            rival_goals: rivalGoals,
            edit_count: 0,
            key_player: keyPlayer,
            qualified_team: isKnockoutMatch() ? qualifiedTeam : null
        })

        if (error) {
            console.log(error)
            alert('Error guardando apuesta')
            return
        }

        alert('Apuesta guardada 🔥')
        navigate('/dashboard')
    }

    const SPAIN_PLAYERS = [
        '🚫 Nadie marca',

        'Lamine Yamal',
        'Nico Williams',
        'Mikel Oyarzabal',
        'Ferran Torres',
        'Dani Olmo',
        'Pedri',

        'Unai Simón',
        'Joan García',
        'David Raya',

        'Marc Cucurella',
        'Alejandro Grimaldo',
        'Pau Cubarsí',
        'Aymeric Laporte',
        'Marc Pubill',
        'Eric García',
        'Marcos Llorente',
        'Pedro Porro',

        'Fabián Ruiz',
        'Martín Zubimendi',
        'Gavi',
        'Rodri',
        'Álex Baena',
        'Mikel Merino',

        'Yeremy Pino',
        'Borja Iglesias',
        'Víctor Muñoz'
    ]

    if (!match) return <h1>Cargando...</h1>

    const notOpenYet = isBettingNotOpenYet()
    const editable = canEditBet()
    const revealByEdits = false
    const locked = isClosed || notOpenYet || (existingBet && !editable)

    return (
        <main className="match-page">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>España vs {match.rival}</h1>
            </header>

            <section className="bet-card">
                {existingBet && !editable && (
                    <p className="bet-warning">
                        🔒 Ya has apostado este partido. Tu apuesta queda bloqueada.
                    </p>
                )}

                {existingBet && editable && (
                    <p className="edit-warning">
                        ✏️ Puedes editar esta apuesta una única vez.
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

                {allPlayersHaveBet() && match.status !== 'closed' && (
                    <p className="bet-warning">
                        👀 Todos han apostado. Las apuestas ya están reveladas.
                    </p>
                )}

                <p className="closing-text">La apuesta se cierra en:</p>
                <strong className={isClosed ? 'countdown closed' : 'countdown'}>
                    {timeLeft}
                </strong>

                <h2>
                    {isKnockoutMatch()
                        ? '¿Quién pasa la eliminatoria?'
                        : '¿Quién ganará?'}
                </h2>

                <div className="winner-options">
                    <button
                        disabled={locked}
                        className={
                            isKnockoutMatch()
                                ? qualifiedTeam === 'España' ? 'selected' : ''
                                : winner === 'España' ? 'selected' : ''
                        }
                        onClick={() => {
                            if (isKnockoutMatch()) {
                                setQualifiedTeam('España')
                            } else {
                                setWinner('España')
                            }
                        }}
                    >
                        🇪🇸 España
                    </button>

                    {!isKnockoutMatch() && (
                        <button
                            disabled={locked}
                            className={winner === 'Empate' ? 'selected' : ''}
                            onClick={() => setWinner('Empate')}
                        >
                            🤝 Empate
                        </button>
                    )}

                    <button
                        disabled={locked}
                        className={
                            isKnockoutMatch()
                                ? qualifiedTeam === match.rival ? 'selected' : ''
                                : winner === match.rival ? 'selected' : ''
                        }
                        onClick={() => {
                            if (isKnockoutMatch()) {
                                setQualifiedTeam(match.rival)
                            } else {
                                setWinner(match.rival)
                            }
                        }}
                    >
                        {match.rival_flag} {match.rival}
                    </button>
                </div>

                <h2>
                    Resultado exacto {isKnockoutMatch() ? '(90 minutos)' : ''}
                </h2>

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

                <h2>Goleador. ¿Quién marca gol?</h2>

                <div className="bet-section">

                    <select
                        value={keyPlayer}
                        disabled={locked}
                        onChange={(e) => setKeyPlayer(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>

                        {SPAIN_PLAYERS.map((player) => (
                            <option
                                key={player}
                                value={player}
                            >
                                {player}
                            </option>
                        ))}
                    </select>
                </div>

                <p className="rules">
                    {isKnockoutMatch() ? (
                        <>
                            Acertar quién pasa: +3 puntos<br />
                            Acertar resultado exacto a 90’: +5 puntos<br />
                            Acertar goleador: +1 punto
                        </>
                    ) : (
                        <>
                            Acertar ganador: +3 puntos<br />
                            Acertar resultado exacto: +5 puntos<br />
                            Acertar goleador: +1 punto
                        </>
                    )}
                </p>

                {(!existingBet || editable) && !isClosed && !notOpenYet && !allPlayersHaveBet() && (
                    <button
                        className="save-bet"
                        onClick={saveBet}
                        disabled={!isValidBet()}
                    >
                        {existingBet ? 'Guardar cambio' : 'Guardar apuesta'}
                    </button>
                )}
            </section>
        </main>
    )
}

export default Match