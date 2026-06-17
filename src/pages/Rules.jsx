import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../App.css'

function Rules() {
    const navigate = useNavigate()

    const [playersCount, setPlayersCount] = useState(0)
    const [players, setPlayers] = useState([])
    const [bets, setBets] = useState([])
    const [drinks, setDrinks] = useState([])
    const entryFee = 5
    const knockoutFee = 2

    useEffect(() => {
        loadPlayersCount()
    }, [])

    async function loadPlayersCount() {
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })

        const { data: playersData } = await supabase
            .from('players')
            .select('*')

        const { data: betsData } = await supabase
            .from('bets')
            .select('*')

        const { data: drinksData } = await supabase
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
        setDrinks(drinksData || [])
        setPlayersCount(count || 0)
    }

    function getLeader() {
        return [...players].sort((a, b) => (b.points || 0) - (a.points || 0))[0]
    }

    function getLastPlayer() {
        return [...players].sort((a, b) => (a.points || 0) - (b.points || 0))[0]
    }

    function getMostOptimistic() {
        const totals = {}

        bets.forEach((bet) => {
            if (bet.winner === 'España') {
                totals[bet.player_id] = (totals[bet.player_id] || 0) + 1
            }
        })

        const winnerId = Object.keys(totals).sort((a, b) => totals[b] - totals[a])[0]

        return players.find((p) => p.id === winnerId)
    }

    function getMostEdited() {
        const totals = {}

        bets.forEach((bet) => {
            totals[bet.player_id] =
                (totals[bet.player_id] || 0) + (bet.edit_count || 0)
        })

        const winnerId = Object.keys(totals).sort((a, b) => totals[b] - totals[a])[0]

        return players.find((p) => p.id === winnerId)
    }

    function getBarKing() {
        const totals = {}

        drinks.forEach((item) => {
            const total =
                (item.beers || 0) +
                (item.drinks || 0) +
                (item.summer_wines || 0)

            totals[item.player_id] = (totals[item.player_id] || 0) + total
        })

        const winnerId = Object.keys(totals).sort((a, b) => totals[b] - totals[a])[0]

        return players.find((p) => p.id === winnerId)
    }

    function getAiPrediction() {
        const leader = getLeader()
        const lastPlayer = getLastPlayer()
        const optimist = getMostOptimistic()
        const edited = getMostEdited()
        const barKing = getBarKing()

        if (!players.length) {
            return {
                title: 'La IA está calentando',
                text: 'Todavía no hay suficientes datos para humillar a nadie con rigor científico.'
            }
        }

        const lines = []

        if (leader) {
            lines.push(`🏆 Favorito provisional: ${leader.name}. La máquina detecta olor a líder.`)
        }

        if (lastPlayer && leader?.id !== lastPlayer.id) {
            lines.push(`📉 Candidato al drama: ${lastPlayer.name}. La remontada empieza por aceptar la realidad.`)
        }

        if (optimist) {
            lines.push(`🇪🇸 Patriota máximo: ${optimist.name}. Confía en España aunque juegue contra Brasil 2002.`)
        }

        if (edited) {
            lines.push(`✏️ Más dudas que un VAR mal calibrado: ${edited.name}. Editar no siempre es mejorar.`)
        }

        if (barKing) {
            lines.push(`🍻 Variable externa detectada: ${barKing.name} podría alterar la clasificación desde la barra.`)
        }

        return {
            title: 'Predicción IA de La Porra',
            text: lines.slice(0, 3).join(' ')
        }
    }

    const aiPrediction = getAiPrediction()

    return (
        <main className="stats-page with-bottom-nav">

            <header className="ranking-hero">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Información de la competición</p>
                    <h1>Reglas 📜</h1>
                </div>
            </header>

            <section className="stats-grid">

                <article className="stat-card featured-stat">
                    <span>🏆</span>
                    <p>Sistema de puntuación</p>

                    <strong>+3 puntos Equipo ganador</strong>
                    <strong>+5 puntos Resultado exacto</strong>
                    <strong>+1 punto Jugador goleador</strong>

                    <small>Máximo: 9 puntos por partido</small>
                </article>

                <article className="stat-card">
                    <span>⏰</span>
                    <p>Apuestas</p>

                    <small>
                        🔓 Se abren 2 días antes del partido que toque
                    </small>

                    <small>
                        🔒 Se cierran 2 horas antes de que empiece el partido
                    </small>

                    <small>
                        👀 Se revelan automáticamente en el momento en el que se cierran (2 horas antes del inicio del partido)
                    </small>

                    <small>
                        👀 Existe la posibilidad de que se revelen antes del cierre: únicamente si TODOS los jugadores han editado su apuesta. Cuando el último de estos guarda el cambio, se revelarían
                    </small>
                </article>

                <article className="stat-card">
                    <span>✏️</span>
                    <p>Edición única</p>

                    <small>
                        Cada jugador puede modificar su apuesta una sola vez.
                    </small>
                </article>

                <article className="stat-card">
                    <span>⚽</span>
                    <p>Goleadores</p>

                    <small>
                        Cada jugador elige un posible goleador español.
                    </small>

                    <small>
                        Si ese jugador marca durante el partido, suma +1 punto.
                    </small>

                    <small>
                        Si hay varios goleadores, cualquiera que coincida con tu apuesta cuenta.
                    </small>

                    <small>
                        Si en tu apuesta España se queda a 0 y marcas "Nadie marca" en goleadores, si no hay goles sumas +1 punto.
                    </small>
                </article>

                <article className="stat-card">
                    <span>🔥</span>
                    <p>Rachas</p>

                    <small>
                        La app muestra tu racha actual en el perfil:
                    </small>

                    <small>
                        🔥 aciertos seguidos si vienes acertando.
                    </small>

                    <small>
                        🥶 fallos seguidos si toca remontar.
                    </small>
                </article>

                <article className="stat-card">
                    <span>🏅</span>
                    <p>Logros</p>

                    <small>
                        👑 Líder actual
                        <br />
                        Ser primero en el ranking.
                    </small>

                    <small>
                        🎯 Resultado exacto
                        <br />
                        Acertar 3 resultados exactos.
                    </small>

                    <small>
                        ⚽ Ojo para ganadores
                        <br />
                        Acertar 5 ganadores.
                    </small>

                    <small>
                        📝 Fiel apostador
                        <br />
                        Apostar 3 o más veces.
                    </small>

                    <small>
                        🧠 Vidente
                        <br />
                        Conseguir un mínimo de 8 puntos en un único partido (siendo 9 el máximo posible).
                    </small>

                    <small>
                        💀 Fracaso
                        <br />
                        No ganar ni 1 punto en un partido.
                    </small>
                </article>

                <article className="stat-card">
                    <span>🍻</span>
                    <p>Hidratación</p>

                    <small>
                        🍺 Cervezas
                        <br />
                        🥃 Copas
                        <br />
                        🍷 Tintos de verano
                        <br />
                        🥤 Refrescos
                        <br />
                        💧 Agua
                    </small>

                    <small>
                        Esto es absurdo y no afecta al ranking. Simplemente optas a salir en estadísticas divertidas.
                    </small>
                </article>

                <article className="stat-card featured-stat">
                    <span>💰</span>
                    <p>Bote actual</p>

                    <strong>{playersCount * entryFee} €</strong>

                    <small>
                        {playersCount} jugadores × {entryFee} €
                    </small>
                </article>

                <article className="stat-card">
                    <span>🏆</span>
                    <p>Fase eliminatoria</p>

                    <small>
                        Si España llega a dieciseisavos:
                    </small>

                    <small>
                        +2 € por jugador por cada partido.
                    </small>

                    <small>
                        (+{playersCount * knockoutFee} € al bote por partido)
                    </small>
                </article>

            </section>

            <section className="absurd-rules-card">
                <div className="absurd-rules-header">
                    <span>📖</span>

                    <div>
                        <p>Reglamento no oficial</p>
                        <h2>Normas absurdas</h2>
                    </div>
                </div>

                <ul>
                    <li>Quejarse del VAR no suma puntos.</li>
                    <li>Decir “yo lo sabía” después del partido no cuenta como acierto.</li>
                    <li>Editar la apuesta y fallarla duele el doble, aunque no reste.</li>
                    <li>El líder tiene derecho a vacilar, pero con moderación.</li>
                    <li>El último tiene derecho a excusas ilimitadas.</li>
                    <li>Si alguien acierta un 0-0, se le debe respeto durante 24 horas.</li>
                    <li>El consumo responsable de bebidas no es obligatorio. Las estadísticas están ahí por algo..</li>
                    <li>Publicar prensa en el tablón es legal, aunque duela.</li>
                    <li>Los milagros en el descuento sí cuentan.</li>
                    <li>Ganar la porra no te convierte en seleccionador nacional, pero casi.</li>
                </ul>
            </section>

            <section className="ai-prediction-card">
                <div className="absurd-rules-header">
                    <span>🤖</span>

                    <div>
                        <p>Análisis automático</p>
                        <h2>{aiPrediction.title}</h2>
                    </div>
                </div>

                <p>{aiPrediction.text}</p>

                <small>
                    La IA de La Porra no tiene validez oficial, pero sí mala leche.
                </small>
            </section>

            <section className="changelog-card">
                <div className="absurd-rules-header">
                    <span>🛠️</span>

                    <div>
                        <p>Historia de la competición</p>
                        <h2>Historial de novedades</h2>
                    </div>
                </div>

                <div className="changelog-list">
                    <article>
                        <strong>v1.0 · Nace La Porra</strong>
                        <p>Login, jugadores, partidos de España, apuestas, ranking y cierre de partidos.</p>
                    </article>

                    <article>
                        <strong>v1.1 · Apuestas serias</strong>
                        <p>Edición única, cierre 2 horas antes, revelado automático y predicción colectiva.</p>
                    </article>

                    <article>
                        <strong>v1.2 · Admin profesional</strong>
                        <p>Crear partidos, jugadores, mensajes, bote, estado de apuestas y resultados.</p>
                    </article>

                    <article>
                        <strong>v1.3 · La app cobra vida</strong>
                        <p>Tablón del Mundial, anuncios con portada, prensa absurda y reglas oficiales.</p>
                    </article>

                    <article>
                        <strong>v1.4 · Estadísticas absurdas</strong>
                        <p>Bebidas, tintos, refrescos, agua, rachas, logros y perfil mejorado.</p>
                    </article>

                    <article>
                        <strong>v1.5 · Personalización total</strong>
                        <p>Avatares con emojis únicos, stickers, pantalla de carga y frases aleatorias.</p>
                    </article>
                </div>
            </section>

            <section className="crazy-stat-card">
                <span>⚽ Mundial 2026</span>

                <p>
                    <br />
                    Lo importante no es participar.
                    <br />
                    Lo importante es ganar la porra.
                </p>
            </section>

            <BottomNav />
        </main>
    )
}

export default Rules