import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Profile() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [ranking, setRanking] = useState([])
    const [myBets, setMyBets] = useState([])

    useEffect(() => {
        loadProfile()
    }, [])

    async function loadProfile() {
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
        matches (
          rival,
          rival_flag,
          stage,
          spain_goals,
          rival_goals,
          status
        )
      `)
            .eq('player_id', player.id)
            .order('created_at', { ascending: false })

        setRanking(playersData || [])
        setMyBets(betsData || [])
    }

    function logout() {
        localStorage.removeItem('player')
        navigate('/login')
    }

    const currentPlayer = ranking.find((p) => p.id === player.id) || player
    const position = ranking.findIndex((p) => p.id === player.id) + 1
    const leader = ranking[0]
    const gapToLeader = leader ? leader.points - currentPlayer.points : 0
    const totalBets = myBets.length
    const closedBets = myBets.filter((bet) => bet.matches?.status === 'closed')
    const pointsFromBets = myBets.reduce((acc, bet) => acc + (bet.points || 0), 0)

    function getPlayerTitle() {
        if (position === 1) return 'Oráculo del Mundial'
        if (position === 2) return 'Aspirante al trono'
        if (position === 3) return 'En zona de podio'
        if (currentPlayer.points === 0) return 'Calentando motores'
        return 'Cazador de puntos'
    }

    function getAchievements() {
        const achievements = []

        if (position === 1) achievements.push('🥇 Líder actual')
        if (currentPlayer.exact_hits > 0) achievements.push('🎯 Resultado exacto')
        if (currentPlayer.winner_hits >= 2) achievements.push('⚽ Buen ojo para ganadores')
        if (totalBets >= 3) achievements.push('📝 Fiel apostador')
        if (closedBets.some((bet) => bet.points === 8)) achievements.push('🧠 Vidente')
        if (closedBets.some((bet) => bet.points === 0)) achievements.push('💀 Fracaso')

        if (achievements.length === 0) {
            achievements.push('🌱 Primeros pasos')
        }

        return achievements
    }

    function getCurrentStreak() {
        const closed = myBets
            .filter((bet) => bet.matches?.status === 'closed')
            .sort((a, b) => b.created_at.localeCompare(a.created_at))

        if (closed.length === 0) {
            return {
                type: 'empty',
                text: 'Todavía no hay racha',
                detail: 'Cuando se cierre algún partido aparecerá aquí.'
            }
        }

        const firstIsHit = closed[0].points > 0
        let count = 0

        for (const bet of closed) {
            const isHit = bet.points > 0

            if (isHit === firstIsHit) {
                count++
            } else {
                break
            }
        }

        if (firstIsHit) {
            return {
                type: 'positive',
                text: `🔥 ${count} acierto${count > 1 ? 's' : ''} seguido${count > 1 ? 's' : ''}`,
                detail: 'Vienes en buena dinámica.'
            }
        }

        return {
            type: 'negative',
            text: `🥶 ${count} fallo${count > 1 ? 's' : ''} seguido${count > 1 ? 's' : ''}`,
            detail: 'Toca remontar en el próximo partido.'
        }
    }

    const streak = getCurrentStreak()

    return (
        <main className="profile-page profile-pretty-page with-bottom-nav">
            <section className="profile-hero-card">
                <div className="profile-big-avatar">
                    {currentPlayer.avatar}
                </div>

                <p className="profile-kicker">Perfil de jugador</p>
                <h1>{currentPlayer.name}</h1>
                <p className="profile-title">{getPlayerTitle()}</p>

                <div className="profile-rank-pill">
                    #{position || '-'} · {currentPlayer.points} puntos
                </div>

                {leader && leader.id !== currentPlayer.id && (
                    <p className="leader-gap">
                        Estás a {gapToLeader} puntos de {leader.avatar} {leader.name}
                    </p>
                )}

                {leader && leader.id === currentPlayer.id && (
                    <p className="leader-gap">
                        Vas líder.
                    </p>
                )}
            </section>

            <section className="profile-stats-grid">
                <article>
                    <span>🏆</span>
                    <p>Puntos</p>
                    <strong>{currentPlayer.points}</strong>
                </article>

                <article>
                    <span>🎯</span>
                    <p>Exactos</p>
                    <strong>{currentPlayer.exact_hits}</strong>
                </article>

                <article>
                    <span>⚽</span>
                    <p>Ganadores</p>
                    <strong>{currentPlayer.winner_hits}</strong>
                </article>

                <article>
                    <span>📝</span>
                    <p>Apuestas</p>
                    <strong>{totalBets}</strong>
                </article>
            </section>

            <section className={`streak-card ${streak.type}`}>
                <span>Racha actual</span>
                <strong>{streak.text}</strong>
                <p>{streak.detail}</p>
            </section>

            <section className="achievements-card">
                <div className="section-title-row">
                    <h2>Logros</h2>
                    <span>{getAchievements().length}</span>
                </div>

                <div className="achievements-list">
                    {getAchievements().map((achievement) => (
                        <span key={achievement}>
                            {achievement}
                        </span>
                    ))}
                </div>
            </section>

            <section className="history-card">
                <div className="section-title-row">
                    <h2>Historial</h2>
                    <span>{pointsFromBets} pts ganados</span>
                </div>

                {myBets.length === 0 ? (
                    <p className="empty-history">
                        Todavía no has hecho ninguna apuesta.
                    </p>
                ) : (
                    myBets.map((bet) => (
                        <article className="history-item" key={bet.id}>
                            <div>
                                <strong>
                                    🇪🇸 España vs {bet.matches?.rival_flag} {bet.matches?.rival}
                                </strong>

                                <p>
                                    Tu apuesta: {bet.winner} · España {bet.spain_goals}-{bet.rival_goals} {bet.matches?.rival}
                                </p>

                                {bet.matches?.status === 'closed' && (
                                    <small>
                                        Resultado real: España {bet.matches?.spain_goals}-{bet.matches?.rival_goals} {bet.matches?.rival}
                                    </small>
                                )}
                            </div>

                            <span className={bet.points > 0 ? 'history-points positive' : 'history-points'}>
                                {bet.matches?.status === 'closed' ? `+${bet.points}` : 'Pend.'}
                            </span>
                        </article>
                    ))
                )}
            </section>

            <button className="logout-button" onClick={logout}>
                Cerrar sesión
            </button>

            <BottomNav />
        </main>
    )
}

export default Profile