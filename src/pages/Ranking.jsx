import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Ranking() {
    const navigate = useNavigate()

    const [players, setPlayers] = useState([])
    const [bets, setBets] = useState([])

    useEffect(() => {
        loadRanking()
    }, [])

    async function loadRanking() {
        const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*')
            .order('points', { ascending: false })
            .order('exact_hits', { ascending: false })
            .order('winner_hits', { ascending: false })

        const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select(`
                *,
                matches (
                    id,
                    rival,
                    rival_flag,
                    match_order,
                    status
                ),
                players (
                    id,
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .not('result_message', 'is', null)
            .order('created_at', { ascending: false })

        setPlayers(playersData || [])
        setBets(betsData || [])
    }

    function renderResultMessage(message) {
        if (!message) return null

        const parts = message
            .split(/(?=🟢|🔴)/g)
            .filter(Boolean)

        return (
            <p className="ranking-message-box">
                {parts.map((part, index) => (
                    <span
                        key={index}
                        className={
                            part.trim().startsWith('🟢')
                                ? 'result-message-success'
                                : part.trim().startsWith('🔴')
                                    ? 'result-message-error'
                                    : ''
                        }
                    >
                        {part.trim()}{' '}
                    </span>
                ))}
            </p>
        )
    }

    function getLastBetForPlayer(playerId) {
        return bets.find((bet) => bet.player_id === playerId)
    }

    function getMedal(index) {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return `#${index + 1}`
    }

    function renderPlayerAvatar(player, className) {
        if (player.avatar_type === 'sticker' && player.avatar_image_url) {
            return (
                <img
                    src={player.avatar_image_url}
                    alt={player.name}
                    className={className}
                />
            )
        }

        return player.avatar
    }

    function getRankingEvolution() {
        const closedMatchIds = [
            ...new Set(
                bets
                    .filter((bet) => bet.matches?.status === 'closed')
                    .sort((a, b) => a.matches.match_order - b.matches.match_order)
                    .map((bet) => bet.match_id)
            )
        ]

        return closedMatchIds.map((matchId) => {
            const matchBets = bets.filter((bet) => bet.match_id === matchId)
            const matchInfo = matchBets[0]?.matches

            const table = players
                .map((player) => {
                    const totalUntilMatch = bets
                        .filter(
                            (bet) =>
                                bet.player_id === player.id &&
                                bet.matches?.status === 'closed' &&
                                bet.matches?.match_order <= matchInfo.match_order
                        )
                        .reduce((acc, bet) => acc + (bet.points || 0), 0)

                    return {
                        ...player,
                        evolutionPoints: totalUntilMatch
                    }
                })
                .sort((a, b) => b.evolutionPoints - a.evolutionPoints)

            return {
                match: matchInfo,
                table
            }
        })
    }

    function getRoundLoser() {
        const closedBets = bets
            .filter((bet) => bet.matches?.status === 'closed')
            .sort((a, b) => b.matches.match_order - a.matches.match_order)

        const lastMatchOrder = closedBets[0]?.matches?.match_order

        if (!lastMatchOrder) return null

        const lastRoundBets = closedBets.filter(
            (bet) => bet.matches?.match_order === lastMatchOrder
        )

        const minPoints = Math.min(...lastRoundBets.map((bet) => bet.points || 0))

        const losers = lastRoundBets.filter(
            (bet) => (bet.points || 0) === minPoints
        )

        return losers[Math.floor(Math.random() * losers.length)]
    }

    function getLoserComment(playerName) {
        const customComments = {
            Pilu: [
                'Sigue reclamando el gol de Cucurella.',
                'El comité de apelación sigue reunido.',
                'Insiste en que aquello era gol de Cucu.'
            ],
            Nacho: [
                'Sigue buscando a Dani Olmo sobre el césped.',
                'Todavía espera que su goleador toque una pelota.',
                'El goleador elegido pidió no ser molestado.'
            ],
            Cámara: [
                'El VAR le rompió el corazón.',
                'Ferran marcó... pero el fuera de juego también.',
                'La bandera del línea acabó con su ilusión.'
            ],
            Adri: [
                'La tecnología volvió a ganar.',
                'La app sigue esperando su apuesta.',
                'Apostar sigue siendo una aventura.'
            ],
            Gabi: [
                'Mikel Merino sigue sin enterarse de que iba convocado por su porra.',
                'Su goleador ni la olió.',
                'Merino sigue en busca y captura.'
            ]
        }

        const generic = [
            'Ni la olió.',
            'Día complicado en la oficina.',
            'La porra fue por otro camino.',
            'Toca revisar la estrategia.',
            'El Mundial no perdona.'
        ]

        const comments = customComments[playerName] || generic

        return comments[Math.floor(Math.random() * comments.length)]
    }

    const podium = players.slice(0, 3)
    const rest = players.slice(3)
    const rankingEvolution = getRankingEvolution()
    const roundLoser = getRoundLoser()

    return (
        <main className="ranking-page ranking-pretty-page with-bottom-nav">
            <header className="ranking-hero">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Clasificación general</p>
                    <h1>Ranking 🏆</h1>
                </div>
            </header>

            {podium.length > 0 && (
                <section className="podium-section">
                    {podium.map((player, index) => (
                        <article
                            className={`podium-card podium-${index + 1}`}
                            key={player.id}
                        >
                            <span className="podium-medal">
                                {getMedal(index)}
                            </span>

                            <div className="podium-avatar">
                                {renderPlayerAvatar(player, 'ranking-sticker-avatar')}
                            </div>

                            <h2>{player.name}</h2>

                            <strong>{player.points} pts</strong>

                            <p>
                                {player.exact_hits || 0} exactos · {player.winner_hits || 0} ganadores · {player.key_player_hits || 0} goleadores
                            </p>
                        </article>
                    ))}
                </section>
            )}

            {rankingEvolution.length > 0 && (
                <section className="ranking-evolution-card">
                    <div className="section-title-row">
                        <h2>Evolución del ranking 📈</h2>
                        <span>{rankingEvolution.length} jornadas</span>
                    </div>

                    <div className="ranking-evolution-scroll">
                        {rankingEvolution.map((round) => (
                            <article className="ranking-evolution-round" key={round.match.id}>
                                <div className="evolution-round-header">
                                    <strong>
                                        🇪🇸 vs {round.match.rival_flag} {round.match.rival}
                                    </strong>
                                </div>

                                {round.table.slice(0, 5).map((player, index) => (
                                    <div className="evolution-row" key={player.id}>
                                        <span className="evolution-position">
                                            #{index + 1}
                                        </span>

                                        <span className="evolution-player">
                                            {renderPlayerAvatar(player, 'evolution-avatar-img')}
                                            {player.name}
                                        </span>

                                        <strong>{player.evolutionPoints} pts</strong>
                                    </div>
                                ))}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {roundLoser && (
                <section className="round-loser-card">
                    <span>🥶 Jornada complicada</span>

                    <h2>
                        {renderPlayerAvatar(roundLoser.players, 'round-loser-avatar')}
                        {roundLoser.players?.name}
                    </h2>

                    <p>{getLoserComment(roundLoser.players?.name)}</p>

                    <small>
                        Última jornada: {roundLoser.points || 0} puntos
                    </small>
                </section>
            )}

            <section className="ranking-list">
                <div className="section-title-row">
                    <h2>Todos los jugadores</h2>
                    <span>{players.length} jugadores</span>
                </div>

                {players.map((player, index) => {
                    const lastBet = getLastBetForPlayer(player.id)

                    return (
                        <article className="ranking-player-card" key={player.id}>
                            <div className="ranking-player-top">
                                <span className="ranking-position">
                                    {getMedal(index)}
                                </span>

                                <div className="ranking-avatar">
                                    {renderPlayerAvatar(player, 'ranking-sticker-avatar')}
                                </div>

                                <div className="ranking-player-info">
                                    <h3>{player.name}</h3>

                                    <p>
                                        {player.exact_hits || 0} resultados exactos · {player.winner_hits || 0} ganadores · {player.key_player_hits || 0} goleadores
                                    </p>
                                </div>

                                <strong className="ranking-points">
                                    {player.points} pts
                                </strong>
                            </div>

                            {lastBet?.result_message && (
                                <p
                                    className={
                                        lastBet.points > 0
                                            ? 'ranking-message-box positive'
                                            : 'ranking-message-box negative'
                                    }
                                >
                                    {renderResultMessage(lastBet.result_message)}
                                </p>
                            )}
                        </article>
                    )
                })}
            </section>

            <BottomNav />
        </main>
    )
}

export default Ranking