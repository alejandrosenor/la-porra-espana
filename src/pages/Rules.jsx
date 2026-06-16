import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Rules() {
    const navigate = useNavigate()

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

                    <strong>35 €</strong>

                    <small>
                        7 jugadores × 5 €
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
                        (+14 € al bote por ronda)
                    </small>
                </article>

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