import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import WorldCupMuseum from './WorldCupMuseum'
import '../App.css'

function WorldCupCalendar() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))
    const audioRef = useRef(null)

    const [matches, setMatches] = useState([])
    const [filter, setFilter] = useState('Todos')
    const [view, setView] = useState('Partidos')
    const [isPlaying, setIsPlaying] = useState(false)
    const [worldFinished, setWorldFinished] = useState(false)

    useEffect(() => {
        loadMatches()
        registerVisit()
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

        const { data: settingsData } = await supabase
            .from('competition_settings')
            .select('world_finished')
            .eq('id', 1)
            .single()

        setMatches(data || [])
        setWorldFinished(settingsData?.world_finished || false)
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

    async function registerVisit() {
        if (!player?.id) return

        const { error } = await supabase
            .from('world_cup_visits')
            .insert({
                player_id: player.id
            })

        if (error) {
            console.log('Error registrando visita mundial:', error)
        }
    }

    const groupedMatches = groupByDate(filteredMatches)
    const groups = getAllTeams()

    if (worldFinished) {
        return <WorldCupMuseum />
    }

    const SPAIN_ROAD_TO_FINAL = [
        {
            id: 1,
            stage: 'Fase de grupos',
            rival: 'Cabo Verde',
            rivalFlag: '🇨🇻',
            score: '0 - 0',
            detail: 'Primer paso completado',
            status: 'completed'
        },
        {
            id: 2,
            stage: 'Fase de grupos',
            rival: 'Arabia Saudita',
            rivalFlag: '🇸🇦',
            score: '4 - 0',
            detail: 'España mantiene el rumbo',
            status: 'completed'
        },
        {
            id: 3,
            stage: 'Fase de grupos',
            rival: 'Uruguay',
            rivalFlag: '🇺🇾',
            score: '1 - 0',
            detail: 'España cierra la fase de grupos',
            status: 'completed'
        },
        {
            id: 4,
            stage: 'Dieciseisavos',
            rival: 'Austria',
            rivalFlag: '🇦🇹',
            score: '3 - 0',
            detail: 'Primera eliminatoria superada',
            status: 'completed'
        },
        {
            id: 5,
            stage: 'Octavos de final',
            rival: 'Portugal',
            rivalFlag: '🇵🇹',
            score: '1 - 0',
            detail: 'Cristiano y Portugal, eliminados',
            status: 'completed'
        },
        {
            id: 6,
            stage: 'Cuartos de final',
            rival: 'Bélgica',
            rivalFlag: '🇧🇪',
            score: '2 - 1',
            detail: 'España se mete entre las cuatro mejores',
            status: 'completed'
        },
        {
            id: 7,
            stage: 'Semifinal',
            rival: 'Francia',
            rivalFlag: '🇫🇷',
            score: '2 - 0',
            detail: 'Oyarzabal y Pedro Porro llevan a España a la final',
            status: 'completed'
        },
        {
            id: 8,
            stage: 'La Gran Final',
            rival: 'Por decidir',
            rivalFlag: '❓',
            score: '19 JUL',
            detail: 'Argentina o Inglaterra. Un último paso.',
            status: 'next'
        }
    ]

    return (
        <main className="worldcup-page with-bottom-nav">
            <header className="ranking-hero">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Centro Mundial</p>
                    <h1>Mundial 2026 📅</h1>
                </div>
            </header>

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

            <section className="spain-road-section">
                <div className="spain-road-heading">
                    <div>
                        <span>🇪🇸 Camino a la gloria</span>
                        <h2>El camino de España</h2>
                        <p>
                            Siete obstáculos superados. Solo queda uno.
                        </p>
                    </div>

                    <div className="spain-road-stars">
                        ⭐
                        <small>A por la segunda</small>
                    </div>
                </div>

                <div className="spain-road-timeline">
                    {SPAIN_ROAD_TO_FINAL.map((match, index) => (
                        <article
                            key={match.id}
                            className={`spain-road-match ${match.status}`}
                        >
                            <div className="spain-road-line">
                                <span className="spain-road-dot">
                                    {match.status === 'completed' ? '✓' : '🏆'}
                                </span>

                                {index < SPAIN_ROAD_TO_FINAL.length - 1 && (
                                    <span className="spain-road-connector" />
                                )}
                            </div>

                            <div className="spain-road-content">
                                <div className="spain-road-stage-row">
                                    <span>{match.stage}</span>

                                    {match.status === 'completed' ? (
                                        <strong>SUPERADO</strong>
                                    ) : (
                                        <strong>PRÓXIMAMENTE</strong>
                                    )}
                                </div>

                                <div className="spain-road-result">
                                    <div className="spain-road-team">
                                        <span>🇪🇸</span>
                                        <strong>España</strong>
                                    </div>

                                    <div className="spain-road-score">
                                        {match.score}
                                    </div>

                                    <div className="spain-road-team rival">
                                        <span>{match.rivalFlag}</span>
                                        <strong>{match.rival}</strong>
                                    </div>
                                </div>

                                <p>{match.detail}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="spain-road-final-message">
                    <span>🏆</span>

                    <div>
                        <small>La historia está esperando</small>
                        <strong>
                            España está a un partido de ser campeona del mundo
                        </strong>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default WorldCupCalendar