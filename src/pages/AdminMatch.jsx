import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

const SPAIN_PLAYERS = [
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

function AdminMatch() {
    const navigate = useNavigate()
    const { id } = useParams()
    const player = JSON.parse(localStorage.getItem('player'))

    const [match, setMatch] = useState(null)
    const [spainGoals, setSpainGoals] = useState(0)
    const [rivalGoals, setRivalGoals] = useState(0)
    const [keyPlayerResults, setKeyPlayerResults] = useState([])
    const [players, setPlayers] = useState([])
    const [bets, setBets] = useState([])

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

        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .order('name')

        const { data: betsData } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', id)

        setPlayers(playersData || [])
        setBets(betsData || [])

        if (data.spain_goals !== null) setSpainGoals(data.spain_goals)
        if (data.rival_goals !== null) setRivalGoals(data.rival_goals)
        setKeyPlayerResults(data.key_player_results || [])
    }

    function getRealWinner() {
        if (spainGoals === rivalGoals) return 'Empate'
        if (spainGoals > rivalGoals) return 'España'
        return match.rival
    }

    function isKeyPlayerHit(bet) {
        return (
            bet.key_player &&
            keyPlayerResults.includes(bet.key_player)
        )
    }

    function calculatePoints(bet) {
        let points = 0

        const winnerHit = bet.winner === getRealWinner()
        const exactHit =
            bet.spain_goals === spainGoals &&
            bet.rival_goals === rivalGoals

        if (winnerHit) points += 3
        if (exactHit) points += 5
        if (isKeyPlayerHit(bet)) points += 1

        return points
    }

    function buildResultMessage(bet) {
        const winnerHit = bet.winner === getRealWinner()
        const exactHit =
            bet.spain_goals === spainGoals &&
            bet.rival_goals === rivalGoals

        const keyPlayerHit = isKeyPlayerHit(bet)

        let message = ''

        if (winnerHit) {
            message += `🟢 +3 Acertó ganador (${getRealWinner()}). `
        } else {
            message += `🔴 No acertó ganador. Apostó ${bet.winner}. `
        }

        if (exactHit) {
            message += `🟢 +5 Clavó el resultado exacto (${spainGoals}-${rivalGoals}). `
        } else {
            message += `🔴 Falló el resultado exacto. Apostó ${bet.spain_goals}-${bet.rival_goals}. `
        }

        if (keyPlayerHit) {
            message += `🟢 +1 Acertó goleador (${bet.key_player}).`
        } else {
            message += `🔴 Falló goleador. Apostó ${bet.key_player || 'Sin elegir'}.`
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

        if (keyPlayerResults.length === 0) {
            alert('Selecciona al menos un goleador del partido antes de cerrar')
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
                    exact_hits: playerData.exact_hits + (exactHit ? 1 : 0),
                    key_player_hits: (playerData.key_player_hits || 0) + (isKeyPlayerHit(bet) ? 1 : 0)
                })
                .eq('id', playerData.id)
        }

        await supabase
            .from('matches')
            .update({
                spain_goals: spainGoals,
                rival_goals: rivalGoals,
                key_player_results: keyPlayerResults,
                status: 'closed'
            })
            .eq('id', id)

        alert('Partido cerrado y puntos calculados 🏆')
        navigate('/ranking')
    }

    async function deleteMatch() {
        const confirmed = confirm(
            '¿Seguro que quieres eliminar este partido? Se borrarán también todas sus apuestas. Esta acción no se puede deshacer.'
        )

        if (!confirmed) return

        const secondConfirm = confirm(
            'Última confirmación: vas a borrar el partido definitivamente.'
        )

        if (!secondConfirm) return

        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', id)

        if (error) {
            console.log(error)
            alert('Error eliminando partido')
            return
        }

        alert('Partido eliminado')
        navigate('/dashboard')
    }

    function playerHasBet(playerId) {
        return bets.some((bet) => bet.player_id === playerId)
    }

    function getBetForPlayer(playerId) {
        return bets.find((bet) => bet.player_id === playerId)
    }

    function toggleKeyPlayer(playerName) {
        const noScorer = '🚫 Ningún jugador decisivo'

        if (playerName === noScorer) {
            setKeyPlayerResults([noScorer])
            return
        }

        const cleanResults = keyPlayerResults.filter((p) => p !== noScorer)

        if (cleanResults.includes(playerName)) {
            setKeyPlayerResults(cleanResults.filter((p) => p !== playerName))
        } else {
            setKeyPlayerResults([...cleanResults, playerName])
        }
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

                <div className="admin-bets-status-card">
                    <div className="section-title-row">
                        <h2>Estado de apuestas</h2>
                        <span>{bets.length}/{players.length}</span>
                    </div>

                    <div className="admin-bets-info">
                        <strong>👀 ¿QUÉ MUESTRA ESTA SECCIÓN?</strong>

                        <p>
                            Aquí puedes comprobar qué jugadores han realizado ya su apuesta para este partido.
                        </p>

                        <p>
                            Mientras las apuestas permanezcan ocultas, solo se mostrará si cada jugador ha apostado o no.
                        </p>

                        <p>
                            El contenido de las apuestas permanecerá secreto para todos, incluidos los administradores, hasta que se revelen.
                        </p>
                    </div>

                    <div className="admin-bets-list">
                        {players.map((player) => {
                            const bet = getBetForPlayer(player.id)
                            const hasBet = playerHasBet(player.id)

                            return (
                                <article
                                    className={hasBet ? 'admin-bet-player done' : 'admin-bet-player pending'}
                                    key={player.id}
                                >
                                    <div>
                                        <strong>{player.avatar} {player.name}</strong>

                                        {hasBet ? (
                                            <p>
                                                {match.status === 'closed' || bets.length === players.length
                                                    ? `Apostó: ${bet.winner} · España ${bet.spain_goals}-${bet.rival_goals} ${match.rival} · Jugador clave: ${bet.key_player || '-'}`
                                                    : 'Ha apostado. Pero la apuesta permanece oculta hasta que se revele, aunque seas administrador.'}
                                            </p>
                                        ) : (
                                            <p>Todavía no ha apostado</p>
                                        )}
                                    </div>

                                    <span>{hasBet ? '✅' : '❌'}</span>
                                </article>
                            )
                        })}
                    </div>
                </div>

                {match.status === 'closed' && (
                    <p className="bet-warning">
                        🔒 Este partido ya está cerrado.
                    </p>
                )}

                <h2><br />Resultado real del partido</h2>

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

                <div className="bet-section">
                    <h2>Goleadores de España del partido</h2>

                    <div className="key-players-grid">
                        {SPAIN_PLAYERS
                            .filter((p) => p !== '🚫 Ningún jugador decisivo')
                            .map((player) => (
                                <button
                                    type="button"
                                    key={player}
                                    disabled={match.status === 'closed'}
                                    className={
                                        keyPlayerResults.includes(player)
                                            ? 'key-player-chip selected'
                                            : 'key-player-chip'
                                    }
                                    onClick={() => toggleKeyPlayer(player)}
                                >
                                    {player}
                                </button>
                            ))}
                    </div>

                    <button
                        type="button"
                        disabled={match.status === 'closed'}
                        className={
                            keyPlayerResults.includes('🚫 Ningún jugador decisivo')
                                ? 'key-player-chip selected no-scorer'
                                : 'key-player-chip no-scorer'
                        }
                        onClick={() => toggleKeyPlayer('🚫 Ningún jugador decisivo')}
                    >
                        🚫 Ningún goleador español
                    </button>
                </div>

                <p className="rules">
                    Goleadores: <strong>
                        {keyPlayerResults.length > 0
                            ? keyPlayerResults.join(', ')
                            : 'Sin seleccionar'}
                    </strong>
                </p>

                <div className="admin-warning">
                    <strong>⚠️ IMPORTANTE</strong>

                    <p>
                        <strong>⚠️ NO LE DES AL BOTÓN SIN HABER FINALIZADO EL PARTIDO. </strong>
                        No cierres el partido hasta que haya terminado oficialmente.
                        Al cerrarlo se reparten los puntos y se actualiza el ranking.
                    </p>

                    <p>
                        Si introduces un resultado incorrecto, jugador clave incorrecto o cierras sin querer podrías alterar toda la clasificación.
                    </p>
                </div>

                <button
                    className="save-bet"
                    onClick={closeMatch}
                    disabled={match.status === 'closed'}
                >
                    Cerrar partido y calcular puntos
                </button>

                <button
                    className="delete-match-button"
                    onClick={deleteMatch}
                >
                    Eliminar partido
                </button>
            </section>
        </main>
    )
}

export default AdminMatch