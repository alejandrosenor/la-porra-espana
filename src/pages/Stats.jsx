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

        setPlayers(playersData || [])
        setBets(betsData || [])
        setDrinksData(hydrationData || [])
    }

    function topBy(field) {
        if (!players.length) return null

        return [...players].sort((a, b) => {
            return (b[field] || 0) - (a[field] || 0)
        })[0]
    }

    function getHighestSingleBet() {
        return [...bets].sort((a, b) => (b.points || 0) - (a.points || 0))[0]
    }

    function getMostEditedPlayer() {
        const editsByPlayer = {}

        bets.forEach((bet) => {
            editsByPlayer[bet.player_id] =
                (editsByPlayer[bet.player_id] || 0) + (bet.edit_count || 0)
        })

        const winnerId = Object.keys(editsByPlayer).sort(
            (a, b) => editsByPlayer[b] - editsByPlayer[a]
        )[0]

        return {
            player: players.find((p) => p.id === winnerId),
            edits: editsByPlayer[winnerId] || 0
        }
    }

    function getMostOptimisticPlayer() {
        const spainWins = {}

        bets.forEach((bet) => {
            if (bet.winner === 'España') {
                spainWins[bet.player_id] = (spainWins[bet.player_id] || 0) + 1
            }
        })

        const winnerId = Object.keys(spainWins).sort(
            (a, b) => spainWins[b] - spainWins[a]
        )[0]

        return {
            player: players.find((p) => p.id === winnerId),
            count: spainWins[winnerId] || 0
        }
    }

    function getBiggestPrediction() {
        return [...bets].sort((a, b) => {
            const totalA = a.spain_goals + a.rival_goals
            const totalB = b.spain_goals + b.rival_goals
            return totalB - totalA
        })[0]
    }

    function getHydrationWinner(type) {
        const totals = {}

        drinksData.forEach((item) => {
            const value = item[type] || 0

            if (!totals[item.player_id]) {
                totals[item.player_id] = {
                    total: 0,
                    player: item.players
                }
            }

            totals[item.player_id].total += value
        })

        return Object.values(totals).sort((a, b) => b.total - a.total)[0]
    }

    function getBarKing() {
        const totals = {}

        drinksData.forEach((item) => {
            const total =
                (item.beers || 0) +
                (item.drinks || 0) +
                (item.summer_wines || 0)

            if (!totals[item.player_id]) {
                totals[item.player_id] = {
                    total: 0,
                    player: item.players
                }
            }

            totals[item.player_id].total += total
        })

        return Object.values(totals).sort((a, b) => b.total - a.total)[0]
    }

    const exactKing = topBy('exact_hits')
    const winnerKing = topBy('winner_hits')
    const pointsLeader = topBy('points')
    const bestBet = getHighestSingleBet()
    const mostEdited = getMostEditedPlayer()
    const optimist = getMostOptimisticPlayer()
    const biggestPrediction = getBiggestPrediction()

    const barKing = getBarKing()
    const beerKing = getHydrationWinner('beers')
    const drinkKing = getHydrationWinner('drinks')
    const summerWineKing = getHydrationWinner('summer_wines')
    const healthyKing = getHydrationWinner('soft_drinks')
    const waterKing = getHydrationWinner('waters')

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
                    <strong>
                        {pointsLeader
                            ? `${pointsLeader.avatar} ${pointsLeader.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {pointsLeader ? `${pointsLeader.points} puntos` : 'Todavía no hay ranking'}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🎯</span>
                    <p>Rey del exacto</p>
                    <strong>
                        {exactKing ? `${exactKing.avatar} ${exactKing.name}` : 'Sin datos'}
                    </strong>
                    <small>
                        {exactKing ? `${exactKing.exact_hits} resultados exactos` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>⚽</span>
                    <p>Más ganadores</p>
                    <strong>
                        {winnerKing ? `${winnerKing.avatar} ${winnerKing.name}` : 'Sin datos'}
                    </strong>
                    <small>
                        {winnerKing ? `${winnerKing.winner_hits} ganadores acertados` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🔥</span>
                    <p>Mejor apuesta</p>
                    <strong>
                        {bestBet?.players
                            ? `${bestBet.players.avatar} ${bestBet.players.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {bestBet ? `${bestBet.points} puntos en un partido` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🇪🇸</span>
                    <p>Más optimista</p>
                    <strong>
                        {optimist.player
                            ? `${optimist.player.avatar} ${optimist.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {optimist.count} apuestas a victoria de España
                    </small>
                </article>

                <article className="stat-card">
                    <span>✏️</span>
                    <p>Más indeciso</p>
                    <strong>
                        {mostEdited.player
                            ? `${mostEdited.player.avatar} ${mostEdited.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {mostEdited.edits} cambios de apuesta
                    </small>
                </article>

                <article className="stat-card">
                    <span>🍻</span>
                    <p>Rey de la barra</p>
                    <strong>
                        {barKing?.player
                            ? `${barKing.player.avatar} ${barKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {barKing ? `${barKing.total} bebidas alcohólicas` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🍺</span>
                    <p>Cervecero oficial</p>
                    <strong>
                        {beerKing?.player
                            ? `${beerKing.player.avatar} ${beerKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {beerKing ? `${beerKing.total} cervezas` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🥃</span>
                    <p>Borrachera</p>
                    <strong>
                        {drinkKing?.player
                            ? `${drinkKing.player.avatar} ${drinkKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {drinkKing ? `${drinkKing.total} copas` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🍷</span>
                    <p>Amante del tinto de verano</p>
                    <strong>
                        {summerWineKing?.player
                            ? `${summerWineKing.player.avatar} ${summerWineKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {summerWineKing ? `${summerWineKing.total} tintos de verano` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>🥤</span>
                    <p>Coca-Cola lovers</p>
                    <strong>
                        {healthyKing?.player
                            ? `${healthyKing.player.avatar} ${healthyKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {healthyKing ? `${healthyKing.total} refrescos` : ''}
                    </small>
                </article>

                <article className="stat-card">
                    <span>💧</span>
                    <p>Hidratado premium</p>
                    <strong>
                        {waterKing?.player
                            ? `${waterKing.player.avatar} ${waterKing.player.name}`
                            : 'Sin datos'}
                    </strong>
                    <small>
                        {waterKing ? `${waterKing.total} aguas` : ''}
                    </small>
                </article>
            </section>

            {biggestPrediction && (
                <section className="crazy-stat-card">
                    <span>Apuesta más loca</span>

                    <h2>
                        {biggestPrediction.players?.avatar} {biggestPrediction.players?.name}
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