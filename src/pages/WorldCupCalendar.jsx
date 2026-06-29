import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function WorldCupCalendar() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))
    const audioRef = useRef(null)

    const [matches, setMatches] = useState([])
    const [filter, setFilter] = useState('Todos')
    const [view, setView] = useState('Partidos')
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        loadMatches()
    }, [])

    useEffect(() => {
        if (!audioRef.current) return

        const handleEnded = () => setIsPlaying(false)

        audioRef.current.addEventListener('ended', handleEnded)

        return () => {
            audioRef.current?.removeEventListener('ended', handleEnded)
        }
    }, [])

    async function loadMatches() {
        const { data } = await supabase
            .from('world_cup_matches')
            .select('*')
            .order('match_date')

        setMatches(data || [])
    }

    const stages = ['Todos', ...new Set(matches.map((m) => m.stage))]

    const filteredMatches =
        filter === 'Todos'
            ? matches
            : matches.filter((m) => m.stage === filter)

    const playedMatches = matches.filter((m) => m.status === 'closed')
    const pendingMatches = matches.filter((m) => m.status !== 'closed')
    const nextMatch = pendingMatches[0]

    const nextSpainMatch = pendingMatches.find(
        (m) => m.home_team === 'España' || m.away_team === 'España'
    )

    function formatDate(matchDate) {
        return new Date(matchDate + 'Z').toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        })
    }

    function formatShortDate(matchDate) {
        return new Date(matchDate + 'Z').toLocaleString('es-ES', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatTime(matchDate) {
        return new Date(matchDate + 'Z').toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function groupByDate(matchesList) {
        return matchesList.reduce((acc, match) => {
            const date = formatDate(match.match_date)
            if (!acc[date]) acc[date] = []
            acc[date].push(match)
            return acc
        }, {})
    }

    function getAllTeams() {
        const teams = {}

        matches
            .filter((match) => match.stage?.startsWith('Grupo'))
            .forEach((match) => {
                const group = match.stage

                if (!teams[group]) teams[group] = {}

                if (!teams[group][match.home_team]) {
                    teams[group][match.home_team] = {
                        name: match.home_team,
                        flag: match.home_flag,
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0
                    }
                }

                if (!teams[group][match.away_team]) {
                    teams[group][match.away_team] = {
                        name: match.away_team,
                        flag: match.away_flag,
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0
                    }
                }

                if (match.status !== 'closed') return

                const home = teams[group][match.home_team]
                const away = teams[group][match.away_team]

                home.played += 1
                away.played += 1

                home.goalsFor += match.home_goals
                home.goalsAgainst += match.away_goals

                away.goalsFor += match.away_goals
                away.goalsAgainst += match.home_goals

                if (match.home_goals > match.away_goals) {
                    home.wins += 1
                    home.points += 3
                    away.losses += 1
                } else if (match.home_goals < match.away_goals) {
                    away.wins += 1
                    away.points += 3
                    home.losses += 1
                } else {
                    home.draws += 1
                    away.draws += 1
                    home.points += 1
                    away.points += 1
                }

                home.goalDifference = home.goalsFor - home.goalsAgainst
                away.goalDifference = away.goalsFor - away.goalsAgainst
            })

        return teams
    }

    function sortGroup(teams) {
        return Object.values(teams).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
            return a.name.localeCompare(b.name)
        })
    }

    function getGroupTopScorer(groupTeams) {
        return [...groupTeams].sort((a, b) => b.goalsFor - a.goalsFor)[0]
    }

    function toggleDaiDai() {
        if (!audioRef.current) {
            audioRef.current = new Audio('/audio/dai-dai.mp3')
            audioRef.current.volume = 0.7

            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false)
            })
        }

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const groupedMatches = groupByDate(filteredMatches)
    const groups = getAllTeams()

    return (
        <main className="worldcup-page with-bottom-nav">
            <header className="ranking-hero">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Centro Mundial</p>
                    <h1>Mundial 2026 📅</h1>
                </div>
            </header>

            <section className="worldcup-tabs">
                <button
                    className={view === 'Partidos' ? 'active' : ''}
                    onClick={() => setView('Partidos')}
                >
                    Partidos
                </button>

                <button
                    className={view === 'Clasificación' ? 'active' : ''}
                    onClick={() => setView('Clasificación')}
                >
                    Clasificación
                </button>
            </section>

            <section className="worldcup-summary-grid">
                <article>
                    <span>📅</span>
                    <strong>{matches.length}</strong>
                    <p>Partidos cargados</p>
                </article>

                <article>
                    <span>✅</span>
                    <strong>{playedMatches.length}</strong>
                    <p>Jugados</p>
                </article>

                <article>
                    <span>⏳</span>
                    <strong>{pendingMatches.length}</strong>
                    <p>Pendientes</p>
                </article>
            </section>

            <section className="anthem-card">
                <div>
                    <span>🎵</span>
                    <div>
                        <h2>Himno oficial del Mundial 2026</h2>
                        <p>Dai Dai - Shakira, Burna Boy. Solo apto para días de Mundial.</p>
                    </div>
                </div>

                <button onClick={toggleDaiDai}>
                    {isPlaying
                        ? '⏸ Pausar'
                        : '▶ Reproducir'}
                </button>

                {isPlaying && (
                    <p className="anthem-now-playing">
                        🎶 SONANDO AHORA: DAI DAI
                    </p>
                )}
            </section>

            {view === 'Partidos' && (
                <>
                    {nextSpainMatch && (
                        <section className="worldcup-feature-card spain-feature">
                            <p>🇪🇸 Próximo partido de España</p>

                            <h2>
                                {nextSpainMatch.home_flag} {nextSpainMatch.home_team}
                                <span> vs </span>
                                {nextSpainMatch.away_flag} {nextSpainMatch.away_team}
                            </h2>

                            <strong>{formatShortDate(nextSpainMatch.match_date)}</strong>
                        </section>
                    )}

                    {nextSpainMatch && nextSpainMatch.stage === 'Dieciseisavos' && (
                        <section className="worldcup-feature-card knockout-spain-card">
                            <p>🔥 España en dieciseisavos</p>

                            <h2>
                                {nextSpainMatch.home_flag} {nextSpainMatch.home_team}
                                <span> vs </span>
                                {nextSpainMatch.away_flag} {nextSpainMatch.away_team}
                            </h2>

                            <strong>{formatShortDate(nextSpainMatch.match_date)}</strong>
                        </section>
                    )}

                    {nextMatch && (
                        <section className="worldcup-feature-card">
                            <p>🔥 Próximo partido del Mundial</p>

                            <h2>
                                {nextMatch.home_flag} {nextMatch.home_team}
                                <span> vs </span>
                                {nextMatch.away_flag} {nextMatch.away_team}
                            </h2>

                            <strong>{formatShortDate(nextMatch.match_date)}</strong>
                        </section>
                    )}

                    <section className="worldcup-filters">
                        {stages.map((stage) => (
                            <button
                                key={stage}
                                className={filter === stage ? 'active' : ''}
                                onClick={() => setFilter(stage)}
                            >
                                {stage}
                            </button>
                        ))}
                    </section>

                    <section className="worldcup-list">
                        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
                            <div key={date} className="worldcup-day">
                                <h2>{date}</h2>

                                {dateMatches.map((match) => {
                                    const isSpainMatch =
                                        match.home_team === 'España' || match.away_team === 'España'

                                    return (
                                        <article
                                            className={
                                                isSpainMatch
                                                    ? 'worldcup-match-card spain-match'
                                                    : 'worldcup-match-card'
                                            }
                                            key={match.id}
                                        >
                                            <div>
                                                <p>{match.stage}</p>

                                                <strong>
                                                    {match.home_flag} {match.home_team}
                                                    <span> vs </span>
                                                    {match.away_flag} {match.away_team}
                                                </strong>

                                                <small>{formatTime(match.match_date)}</small>
                                            </div>

                                            <div className="worldcup-right">
                                                {match.status === 'closed' ? (
                                                    <span className="worldcup-score">
                                                        {match.home_goals} - {match.away_goals}
                                                    </span>
                                                ) : (
                                                    <span className="worldcup-status">
                                                        Programado
                                                    </span>
                                                )}

                                                {player?.is_admin && (
                                                    <button
                                                        className="worldcup-admin-button"
                                                        onClick={() => navigate(`/admin/world-cup-match/${match.id}`)}
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        ))}
                    </section>
                </>
            )}

            {view === 'Clasificación' && (
                <section className="groups-standings">
                    {Object.entries(groups).map(([groupName, groupTeams]) => {
                        const sortedTeams = sortGroup(groupTeams)
                        const topScorer = getGroupTopScorer(sortedTeams)

                        return (
                            <article className="group-table-card" key={groupName}>
                                <div className="section-title-row">
                                    <h2>{groupName}</h2>
                                    <span>
                                        Máx. goles: {topScorer?.flag} {topScorer?.name} ({topScorer?.goalsFor})
                                    </span>
                                </div>

                                <div className="group-table">
                                    <div className="group-table-header">
                                        <span>Equipo</span>
                                        <span>PJ</span>
                                        <span>G</span>
                                        <span>E</span>
                                        <span>P</span>
                                        <span>Pts</span>
                                        <span>GF</span>
                                        <span>GC</span>
                                        <span>DG</span>
                                    </div>

                                    {sortedTeams.map((team, index) => (
                                        <div
                                            className={
                                                index < 2
                                                    ? 'group-table-row qualified'
                                                    : 'group-table-row'
                                            }
                                            key={team.name}
                                        >
                                            <span className="team-name">
                                                <b>{index + 1}</b> {team.flag} {team.name}
                                                {index === 0 && <em> 👑</em>}
                                            </span>
                                            <span>{team.played}</span>
                                            <span>{team.wins}</span>
                                            <span>{team.draws}</span>
                                            <span>{team.losses}</span>
                                            <span className="points-cell">{team.points}</span>
                                            <span>{team.goalsFor}</span>
                                            <span>{team.goalsAgainst}</span>
                                            <span>{team.goalDifference}</span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        )
                    })}
                </section>
            )}

            <BottomNav />
        </main>
    )
}

export default WorldCupCalendar