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

        setPlayers(playersData)
        setBets(betsData)
    }

    function getLastBetForPlayer(playerId) {
        return bets.find((bet) => bet.player_id === playerId)
    }

    return (
        <main className="ranking-page with-bottom-nav">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>Ranking</h1>
            </header>

            <section className="ranking-card">
                {players.map((player, index) => {
                    const lastBet = getLastBetForPlayer(player.id)

                    return (
                        <div className="ranking-row" key={player.id}>
                            <div className="ranking-main-info">
                                <span className="position">#{index + 1}</span>

                                <div>
                                    <span className="player-name">
                                        {player.avatar} {player.name}
                                    </span>

                                    {lastBet?.result_message && (
                                        <p
                                            className={
                                                lastBet.points > 0
                                                    ? 'ranking-message-positive'
                                                    : 'ranking-message-negative'
                                            }
                                        >
                                            {lastBet.result_message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <strong>{player.points} pts</strong>
                        </div>
                    )
                })}
            </section>
            <BottomNav />
        </main>
    )
}

export default Ranking