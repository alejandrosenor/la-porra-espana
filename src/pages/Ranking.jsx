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
            .select('*')
            .not('result_message', 'is', null)
            .order('created_at', { ascending: false })

        if (playersError || betsError) {
            console.log(playersError || betsError)
            return
        }

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

    const podium = players.slice(0, 3)
    const rest = players.slice(3)

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