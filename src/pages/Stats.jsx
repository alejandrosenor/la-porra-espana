import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Stats() {
    const navigate = useNavigate()

    const [players, setPlayers] = useState([])
    const [bets, setBets] = useState([])
    const [drinksData, setDrinksData] = useState([])
    const [worldCupVisits, setWorldCupVisits] = useState([])
    const [disciplinaryCards, setDisciplinaryCards] = useState([])

    useEffect(() => {
        loadStats()
    }, [])

    async function loadStats() {
        const { data: playersData } = await supabase
            .from('players')
            .select('*')

        const { data: betsData } = await supabase
            .from('bets')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                ),
                matches (
                    rival,
                    rival_flag,
                    status
                )
            `)

        const { data: hydrationData } = await supabase
            .from('drinks')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)

        const { data: visitsData, error: visitsError } = await supabase
            .from('world_cup_visits')
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

        if (visitsError) {
            console.log(visitsError)
        } else {
            setWorldCupVisits(visitsData || [])
        }

        const { data: cardsData, error: cardsError } = await supabase
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

        if (cardsError) {
            console.log(cardsError)
        } else {
            setDisciplinaryCards(cardsData || [])
        }

        setPlayers(playersData || [])
        setBets(betsData || [])
        setDrinksData(hydrationData || [])
    }

    function renderAvatar(player) {
        if (player?.avatar_type === 'sticker' && player?.avatar_image_url) {
            return (
                <img
                    src={player.avatar_image_url}
                    alt={player.name}
                    className="stats-inline-avatar"
                />
            )
        }

        return (
            <span className="stats-inline-emoji">
                {player?.avatar || '👤'}
            </span>
        )
    }

    function PlayerName({ player, large = false }) {
        if (!player) return <>Sin datos</>

        return (
            <span
                className={
                    large
                        ? 'stats-player-name stats-player-name-large'
                        : 'stats-player-name'
                }
            >
                {renderAvatar(player)}
                <span>{player.name}</span>
            </span>
        )
    }

    function topPlayersBy(field) {
        const maxValue = Math.max(...players.map((p) => p[field] || 0))

        if (!players.length || maxValue === 0) {
            return {
                players: [],
                value: 0
            }
        }

        return {
            players: players.filter((p) => (p[field] || 0) === maxValue),
            value: maxValue
        }
    }

    function StatWinners({ result, label }) {
        if (!result.players.length) {
            return renderEmptyStat()
        }

        const visiblePlayers = result.players.slice(0, 4)
        const hiddenCount = result.players.length - visiblePlayers.length

        return (
            <>
                <strong className="stats-summary-title">
                    {result.players.length === 1
                        ? <PlayerName player={result.players[0]} />
                        : `${result.players.length} jugadores empatados`}
                </strong>

                {result.players.length > 1 && (
                    <div className="stats-compact-list">
                        {visiblePlayers.map((player) => (
                            <span key={player.id}>
                                <PlayerName player={player} />
                            </span>
                        ))}

                        {hiddenCount > 0 && (
                            <span className="stats-more-chip">
                                +{hiddenCount} más
                            </span>
                        )}
                    </div>
                )}

                <small>
                    {result.value} {label}
                </small>
            </>
        )
    }

    function BetWinners({ result, label }) {
        if (!result.bets.length) {
            return renderEmptyStat()
        }

        const visibleBets = result.bets.slice(0, 4)
        const hiddenCount = result.bets.length - visibleBets.length

        return (
            <>
                <strong className="stats-summary-title">
                    {result.bets.length === 1
                        ? <PlayerName player={result.bets[0].players} />
                        : `${result.bets.length} jugadores empatados`}
                </strong>

                {result.bets.length > 1 && (
                    <div className="stats-compact-list">
                        {visibleBets.map((bet) => (
                            <span key={bet.id}>
                                <PlayerName player={bet.players} />
                            </span>
                        ))}

                        {hiddenCount > 0 && (
                            <span className="stats-more-chip">
                                +{hiddenCount} más
                            </span>
                        )}
                    </div>
                )}

                <small>
                    {result.value} {label}
                </small>
            </>
        )
    }

    function hasValue(player, field) {
        return player && (player[field] || 0) > 0
    }

    function renderEmptyStat() {
        return (
            <>
                <strong>Sin datos definidos</strong>
                <small>Todavía no hay información suficiente</small>
            </>
        )
    }

    function getHighestSingleBets() {
        const validBets = bets.filter((bet) => (bet.points || 0) > 0)

        if (!validBets.length) {
            return {
                bets: [],
                value: 0
            }
        }

        const maxValue = Math.max(...validBets.map((bet) => bet.points || 0))

        return {
            bets: validBets.filter((bet) => (bet.points || 0) === maxValue),
            value: maxValue
        }
    }

    function getMostEditedPlayers() {
        const totals = {}

        bets.forEach((bet) => {
            totals[bet.player_id] =
                (totals[bet.player_id] || 0) + (bet.edit_count || 0)
        })

        const maxValue = Math.max(0, ...Object.values(totals))

        if (maxValue === 0) {
            return {
                players: [],
                value: 0
            }
        }

        return {
            players: players.filter((player) => totals[player.id] === maxValue),
            value: maxValue
        }
    }

    function getMostOptimisticPlayers() {
        const totals = {}

        bets.forEach((bet) => {
            if (bet.winner === 'España') {
                totals[bet.player_id] = (totals[bet.player_id] || 0) + 1
            }
        })

        const maxValue = Math.max(0, ...Object.values(totals))

        if (maxValue === 0) {
            return {
                players: [],
                value: 0
            }
        }

        return {
            players: players.filter((player) => totals[player.id] === maxValue),
            value: maxValue
        }
    }

    function getBiggestPrediction() {
        return [...bets].sort((a, b) => {
            const totalA = a.spain_goals + a.rival_goals
            const totalB = b.spain_goals + b.rival_goals
            return totalB - totalA
        })[0]
    }

    function getHydrationWinners(type) {
        const totals = {}

        drinksData.forEach((item) => {
            const value = item[type] || 0

            totals[item.player_id] = (totals[item.player_id] || 0) + value
        })

        const maxValue = Math.max(0, ...Object.values(totals))

        if (maxValue === 0) {
            return {
                players: [],
                value: 0
            }
        }

        return {
            players: players.filter((player) => totals[player.id] === maxValue),
            value: maxValue
        }
    }

    function getBarKings() {
        const totals = {}

        drinksData.forEach((item) => {
            const total =
                (item.beers || 0) +
                (item.drinks || 0) +
                (item.summer_wines || 0)

            totals[item.player_id] = (totals[item.player_id] || 0) + total
        })

        const maxValue = Math.max(0, ...Object.values(totals))

        if (maxValue === 0) {
            return {
                players: [],
                value: 0
            }
        }

        return {
            players: players.filter((player) => totals[player.id] === maxValue),
            value: maxValue
        }
    }

    function getWorldCupVisitKing() {
        const visitsByPlayer = {}

        worldCupVisits.forEach((visit) => {
            const playerId = visit.player_id

            if (!visitsByPlayer[playerId]) {
                visitsByPlayer[playerId] = {
                    player: visit.players,
                    total: 0
                }
            }

            visitsByPlayer[playerId].total += 1
        })

        const ranking = Object.values(visitsByPlayer)
            .filter((item) => item.player)
            .sort((a, b) => b.total - a.total)

        return ranking[0] || null
    }

    function getCardKing(type) {
        const totals = {}

        disciplinaryCards
            .filter((card) => card.card_type === type)
            .forEach((card) => {
                if (!card.player_id) return

                if (!totals[card.player_id]) {
                    totals[card.player_id] = {
                        player: card.player,
                        total: 0
                    }
                }

                totals[card.player_id].total += 1
            })

        return Object.values(totals).sort((a, b) => b.total - a.total)[0] || null
    }

    const yellowKing = getCardKing('yellow')
    const redKing = getCardKing('red')

    const worldCupVisitKing = getWorldCupVisitKing()

    const exactKing = topPlayersBy('exact_hits')
    const winnerKing = topPlayersBy('winner_hits')
    const pointsLeader = topPlayersBy('points')
    const goalKing = topPlayersBy('key_player_hits')
    const bestBets = getHighestSingleBets()
    const mostEdited = getMostEditedPlayers()
    const optimist = getMostOptimisticPlayers()
    const biggestPrediction = getBiggestPrediction()

    const barKing = getBarKings()
    const beerKing = getHydrationWinners('beers')
    const drinkKing = getHydrationWinners('drinks')
    const summerWineKing = getHydrationWinners('summer_wines')
    const healthyKing = getHydrationWinners('soft_drinks')
    const waterKing = getHydrationWinners('waters')

    return (
        <main className="stats-page with-bottom-nav">
            <header className="ranking-hero">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Datos de la competición</p>
                    <h1>Estadísticas 📊</h1>
                </div>
            </header>

            <section className="stats-grid">
                <article className="stat-card featured-stat">
                    <span>👑</span>
                    <p>Líder actual</p>

                    <StatWinners
                        result={pointsLeader}
                        label="puntos"
                    />
                </article>

                <article className="stat-card">
                    <span>🎯</span>
                    <p>Rey del exacto</p>

                    <StatWinners
                        result={exactKing}
                        label="resultados exactos"
                    />
                </article>

                <article className="stat-card">
                    <span>⭐</span>
                    <p>Más ganadores</p>

                    <StatWinners
                        result={winnerKing}
                        label="ganadores acertados"
                    />
                </article>

                <article className="stat-card">
                    <span>🥅</span>
                    <p>Rey del gol</p>

                    <StatWinners
                        result={goalKing}
                        label="goleadores acertados"
                    />
                </article>

                <article className="stat-card">
                    <span>🔥</span>
                    <p>Mejor apuesta</p>

                    <BetWinners
                        result={bestBets}
                        label="puntos en un partido"
                    />
                </article>

                <article className="stat-card">
                    <span>🇪🇸</span>
                    <p>Más optimista</p>

                    <StatWinners
                        result={optimist}
                        label="apuestas a victoria de España"
                    />
                </article>

                <article className="stat-card">
                    <span>✏️</span>
                    <p>Más indeciso</p>

                    <StatWinners
                        result={mostEdited}
                        label="cambios de apuesta"
                    />
                </article>

                <article className="stat-card">
                    <span>🌍</span>
                    <p>Vicente Maroto</p>

                    {worldCupVisitKing && worldCupVisitKing.total > 0 ? (
                        <>
                            <strong>
                                <PlayerName player={worldCupVisitKing.player} />
                            </strong>
                            <small>{worldCupVisitKing.total} visitas a Mundial</small>
                        </>
                    ) : (
                        renderEmptyStat()
                    )}
                </article>

                <article className="stat-card">
                    <span>🟨</span>
                    <p>Más conflictivo</p>

                    {yellowKing ? (
                        <>
                            <strong>
                                <PlayerName player={yellowKing.player} />
                            </strong>
                            <small>{yellowKing.total} amarillas</small>
                        </>
                    ) : (
                        renderEmptyStat()
                    )}
                </article>

                <article className="stat-card">
                    <span>🟥</span>
                    <p>Expulsado del Mundial</p>

                    {redKing ? (
                        <>
                            <strong>
                                <PlayerName player={redKing.player} />
                            </strong>
                            <small>{redKing.total} rojas</small>
                        </>
                    ) : (
                        renderEmptyStat()
                    )}
                </article>

                <article className="stat-card">
                    <span>🍻</span>
                    <p>Rey de la barra</p>

                    <StatWinners
                        result={barKing}
                        label="bebidas alcohólicas"
                    />
                </article>

                <article className="stat-card">
                    <span>🍺</span>
                    <p>Cervecero oficial</p>

                    <StatWinners
                        result={beerKing}
                        label="cervezas"
                    />
                </article>

                <article className="stat-card">
                    <span>🥃</span>
                    <p>Borrachera</p>

                    <StatWinners
                        result={drinkKing}
                        label="copas"
                    />
                </article>

                <article className="stat-card">
                    <span>🍷</span>
                    <p>Amante del tinto de verano</p>

                    <StatWinners
                        result={summerWineKing}
                        label="tintos de verano"
                    />
                </article>

                <article className="stat-card">
                    <span>🥤</span>
                    <p>Coca-Cola lovers</p>

                    <StatWinners
                        result={healthyKing}
                        label="refrescos"
                    />
                </article>

                <article className="stat-card">
                    <span>💧</span>
                    <p>Hidratado premium</p>

                    <StatWinners
                        result={waterKing}
                        label="aguas"
                    />
                </article>
            </section>

            {biggestPrediction && (
                <section className="crazy-stat-card">
                    <span>Apuesta más loca</span>

                    <h2>
                        <PlayerName
                            player={biggestPrediction.players}
                            large={true}
                        />
                    </h2>

                    <p>
                        Apostó España {biggestPrediction.spain_goals}-{biggestPrediction.rival_goals}{' '}
                        {biggestPrediction.matches?.rival}
                    </p>
                </section>
            )}

            <BottomNav />
        </main>
    )
}

export default Stats