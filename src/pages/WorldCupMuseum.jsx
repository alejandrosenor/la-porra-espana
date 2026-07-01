import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function WorldCupMuseum() {
    const navigate = useNavigate()

    const [players, setPlayers] = useState([])
    const [bets, setBets] = useState([])
    const [drinks, setDrinks] = useState([])
    const [cards, setCards] = useState([])
    const [settings, setSettings] = useState(null)

    useEffect(() => {
        loadMuseum()
    }, [])

    async function loadMuseum() {
        const { data: settingsData } = await supabase
            .from('competition_settings')
            .select('*')
            .eq('id', 1)
            .single()

        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .order('points', { ascending: false })
            .order('exact_hits', { ascending: false })
            .order('winner_hits', { ascending: false })

        const { data: betsData } = await supabase
            .from('bets')
            .select(`
                *,
                players (
                    id,
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                ),
                matches (
                    rival,
                    rival_flag,
                    stage,
                    status
                )
            `)

        const { data: drinksData } = await supabase
            .from('drinks')
            .select(`
                *,
                players (
                    id,
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)

        const { data: cardsData } = await supabase
            .from('disciplinary_cards')
            .select(`
                *,
                player:players!disciplinary_cards_player_id_fkey (
                    id,
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .order('created_at', { ascending: false })

        setSettings(settingsData)
        setPlayers(playersData || [])
        setBets(betsData || [])
        setDrinks(drinksData || [])
        setCards(cardsData || [])
    }

    function renderAvatar(player) {
        if (player?.avatar_type === 'sticker' && player?.avatar_image_url) {
            return <img src={player.avatar_image_url} alt={player.name} className="museum-avatar-img" />
        }

        return <span>{player?.avatar || '👤'}</span>
    }

    function getHydrationTotal(playerId) {
        return drinks
            .filter((item) => item.player_id === playerId)
            .reduce((acc, item) =>
                acc +
                (item.beers || 0) +
                (item.drinks || 0) +
                (item.summer_wines || 0) +
                (item.soft_drinks || 0) +
                (item.waters || 0),
                0)
    }

    function getCardTotal(playerId) {
        return cards.filter((card) => card.player_id === playerId).length
    }

    const champion = players[0]
    const second = players[1]
    const third = players[2]

    const bestExact = [...players].sort((a, b) => (b.exact_hits || 0) - (a.exact_hits || 0))[0]
    const bestScorer = [...players].sort((a, b) => (b.key_player_hits || 0) - (a.key_player_hits || 0))[0]
    const barKing = [...players].sort((a, b) => getHydrationTotal(b.id) - getHydrationTotal(a.id))[0]
    const mostSanctioned = [...players].sort((a, b) => getCardTotal(b.id) - getCardTotal(a.id))[0]

    const perfectBets = bets.filter((bet) => bet.points === 9)
    const bestBet = [...bets].sort((a, b) => (b.points || 0) - (a.points || 0))[0]

    return (
        <main className="museum-page with-bottom-nav">
            <section className="museum-hero">
                <button onClick={() => navigate('/dashboard')}>← Volver</button>

                <span>🏛️</span>
                <p>Museo oficial</p>
                <h1>Mundial 2026</h1>
                <strong>La Porra ha llegado a su fin</strong>

                {settings?.finished_at && (
                    <small>
                        Inaugurado el{' '}
                        {new Date(settings.finished_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </small>
                )}
            </section>

            {champion && (
                <section className="museum-champion-card epic-champion-card">
                    <div className="champion-light-rays"></div>

                    <p>👑 Campeón absoluto</p>

                    <div className="museum-champion-avatar epic-winner-avatar">
                        <span className="winner-crown">👑</span>
                        <span className="winner-glow-ring"></span>
                        {renderAvatar(champion)}
                    </div>

                    <h2>{champion.name}</h2>
                    <strong>{champion.points} puntos</strong>

                    <div className="champion-stats-row">
                        <span>{champion.exact_hits || 0}<small>Exactos</small></span>
                        <span>{champion.winner_hits || 0}<small>Clasificados</small></span>
                        <span>{champion.key_player_hits || 0}<small>Goleadores</small></span>
                    </div>
                </section>
            )}

            <section className="museum-podium">
                {[champion, second, third].filter(Boolean).map((player, index) => (
                    <article key={player.id} className={`museum-podium-card place-${index + 1}`}>
                        <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                        <div>{renderAvatar(player)}</div>
                        <h3>{player.name}</h3>
                        <strong>{player.points} pts</strong>
                    </article>
                ))}
            </section>

            <section className="museum-awards">
                <h2>🎖️ Premios especiales</h2>

                <div className="museum-awards-grid">
                    <article>
                        <span>🎯</span>
                        <p>Francotirador</p>
                        <strong>{bestExact?.name || '-'}</strong>
                        <small>{bestExact?.exact_hits || 0} exactos</small>
                    </article>

                    <article>
                        <span>⚽</span>
                        <p>Cazagoles</p>
                        <strong>{bestScorer?.name || '-'}</strong>
                        <small>{bestScorer?.key_player_hits || 0} goleadores</small>
                    </article>

                    <article>
                        <span>🍻</span>
                        <p>Rey de la barra</p>
                        <strong>{barKing?.name || '-'}</strong>
                        <small>{barKing ? getHydrationTotal(barKing.id) : 0} bebidas</small>
                    </article>

                    <article>
                        <span>👮</span>
                        <p>Más sancionado</p>
                        <strong>{mostSanctioned?.name || '-'}</strong>
                        <small>{mostSanctioned ? getCardTotal(mostSanctioned.id) : 0} sanciones</small>
                    </article>

                    <article>
                        <span>👏</span>
                        <p>Partidos perfectos</p>
                        <strong>{perfectBets.length}</strong>
                        <small>apuestas de 9 puntos</small>
                    </article>

                    <article>
                        <span>🔥</span>
                        <p>Mejor apuesta</p>
                        <strong>{bestBet?.players?.name || '-'}</strong>
                        <small>{bestBet?.points || 0} puntos</small>
                    </article>
                </div>
            </section>

            <section className="museum-final-ranking">
                <h2>📜 Clasificación final</h2>

                {players.map((player, index) => (
                    <article key={player.id}>
                        <span>{index + 1}</span>

                        <div className="museum-ranking-player">
                            {renderAvatar(player)}
                            <strong>{player.name}</strong>
                        </div>

                        <p>{player.points} pts</p>
                    </article>
                ))}
            </section>

            <section className="museum-udm">
                <h2>👮 Expedientes archivados</h2>

                {cards.length === 0 ? (
                    <p>La UDM no tuvo que actuar. Increíble.</p>
                ) : (
                    cards.slice(0, 8).map((card) => (
                        <article key={card.id} className={card.card_type}>
                            <strong>
                                Expediente FIFA-PORRA nº{card.case_number || '---'} · {card.player?.name}
                            </strong>
                            <p>{card.reason}</p>
                        </article>
                    ))
                )}
            </section>

            <section className="museum-credits">
                <span>❤️</span>
                <h2>Gracias por participar</h2>
            </section>

            <BottomNav />
        </main>
    )
}

export default WorldCupMuseum