import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../App.css'

function Rules() {
    const navigate = useNavigate()

    const [playersCount, setPlayersCount] = useState(0)
    const entryFee = 5
    const knockoutFee = 2

    useEffect(() => {
        loadPlayersCount()
    }, [])

    async function loadPlayersCount() {
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })

        setPlayersCount(count || 0)
    }

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

                    <small>
                        Cuando las apuestas se cierren, ya no se podrá editar, aunque no hayas usado tu cambio.
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
                        La app muestra tu racha actual en el perfil (cuántos partidos seguidos llevas sumando puntos):
                    </small>

                    <small>
                        🔥 Cuenta cualquier punto conseguido: ganador, resultado exacto o goleador.
                    </small>

                    <small>
                        🥶 Si no puntúas en un partido cerrado, la racha se corta.
                    </small>
                </article>

                <article className="stat-card">
                    <span>👮</span>
                    <p>Unidad Disciplinaria del Mundial</p>

                    <small>
                        La Unidad Disciplinaria del Mundial, también conocida como UDM, es el organismo oficial de La Porra encargado de vigilar comportamientos sospechosos, protestas excesivas, lloros por el VAR, abusos de bugs y cualquier acto que atente contra el buen nombre de la competición.
                    </small>

                    <small>
                        Las tarjetas NO afectan directamente a la puntuación del ranking, salvo que el administrador decida aplicar una penalización adicional.
                    </small>

                    <small>
                        <br/><br/>🟨 Tarjeta amarilla: Aviso disciplinario por conducta dudosa, quejas reiteradas, comportamiento sospechoso o acciones que merezcan quedar registradas en el expediente.
                    </small>

                    <small>
                        🟥 Tarjeta roja: Sanción grave por aprovechar fallos de la aplicación, alterar estadísticas, manipular datos o realizar acciones consideradas inadmisibles por el Comité.
                    </small>

                    <small>
                        <br/><br/>📄 Expediente disciplinario: Cada tarjeta genera un expediente oficial con número, jugador sancionado, tipo de tarjeta, motivo y fecha. El expediente será visible en el perfil del jugador y en las últimas sanciones del inicio.
                    </small>

                    <small>
                        🚫 Penalización administrativa: En casos graves, la administración podrá limitar temporalmente funciones de la aplicación a un jugador, incluyendo apuestas, hidratación, publicaciones en el tablón o acceso a determinadas herramientas.
                    </small>

                    <small>
                        <br/><br/>⚖️ Nota del Comité: La UDM actuará siempre con imparcialidad, rigor institucional y un nivel de cachondeo absolutamente incompatible con cualquier organismo serio.
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

                <article className="stat-card">
                    <span>🏅</span>
                    <p>Logros</p>

                    <div className="achievement-rule">
                        <span>🥇</span>
                        <div>
                            <strong>Líder actual</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Ser primero en el ranking.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>📝</span>
                        <div>
                            <strong>Fiel apostador</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Apostar 3 o más veces.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>⭐</span>
                        <div>
                            <strong>Primer ganador acertado</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Acertar el ganador de un partido por primera vez.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🏅</span>
                        <div>
                            <strong>Buen ojo para ganadores</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Acertar 5 o más ganadores.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🥅</span>
                        <div>
                            <strong>Primer goleador acertado</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Acertar un goleador por primera vez.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>⚽</span>
                        <div>
                            <strong>Hat-trick</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Acertar 3 goleadores.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>👟</span>
                        <div>
                            <strong>Especialista en goleadores</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Acertar 5 o más goleadores.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🎯</span>
                        <div>
                            <strong>Resultado exacto</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Acertar un resultado exacto.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🏹</span>
                        <div>
                            <strong>Das en el clavo</strong>
                            <div className="achievement-rarity legendary">
                                LEGENDARIO
                            </div>
                            <p>Acertar 3 o más resultados exactos.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>💀</span>
                        <div>
                            <strong>Fracaso</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>No ganar ni 1 punto en un partido.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>‼️</span>
                        <div>
                            <strong>Doble acierto</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Acertar ganador y goleador en el mismo partido.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🧠</span>
                        <div>
                            <strong>Vidente</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Acertar ganador y resultado exacto en el mismo partido.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>👏</span>
                        <div>
                            <strong>Partido perfecto</strong>
                            <div className="achievement-rarity legendary">
                                LEGENDARIO
                            </div>
                            <p>Conseguir 9 puntos en un partido: ganador, resultado exacto y goleador.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🏃‍➡️</span>
                        <div>
                            <strong>Pistoletazo de salida</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Alcanzar 10 puntos en la clasificación.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🔝</span>
                        <div>
                            <strong>Buen ritmo de carrera</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Alcanzar 20 puntos en la clasificación.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🏆</span>
                        <div>
                            <strong>Leyenda</strong>
                            <div className="achievement-rarity legendary">
                                LEGENDARIO
                            </div>
                            <p>Alcanzar 25 puntos en la clasificación.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>😇</span>
                        <div>
                            <strong>Expediente limpio</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Terminar sin recibir ninguna tarjeta disciplinaria.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🟨</span>
                        <div>
                            <strong>Primera amarilla</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Recibir tu primera tarjeta amarilla del Comité Disciplinario.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>😈</span>
                        <div>
                            <strong>Cliente habitual</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Acumular 3 tarjetas amarillas.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🚨</span>
                        <div>
                            <strong>Suspendido</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Recibir tu primera tarjeta roja.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🟥</span>
                        <div>
                            <strong>Buscado por la FIFA</strong>
                            <div className="achievement-rarity legendary">
                                LEGENDARIO
                            </div>
                            <p>Recibir dos tarjetas rojas durante la competición.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🍺</span>
                        <div>
                            <strong>Primera cerveza</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Registrar al menos una cerveza.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🍻</span>
                        <div>
                            <strong>Catador de cervezas</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Registrar 10 cervezas.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🍷</span>
                        <div>
                            <strong>Veranito</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Registrar 10 tintos de verano.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🥴</span>
                        <div>
                            <strong>Noche complicada</strong>
                            <div className="achievement-rarity common">
                                COMÚN
                            </div>
                            <p>Registrar al menos una copa.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🥂</span>
                        <div>
                            <strong>Rey de la barra</strong>
                            <div className="achievement-rarity epic">
                                ÉPICO
                            </div>
                            <p>Registrar 30 bebidas alcohólicas entre cervezas, copas y tintos.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🥤</span>
                        <div>
                            <strong>Coca-Cola adicto</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Registrar 10 refrescos.</p>
                        </div>
                    </div>

                    <div className="achievement-rule">
                        <span>🚰</span>
                        <div>
                            <strong>Fuente pública</strong>
                            <div className="achievement-rarity rare">
                                RARO
                            </div>
                            <p>Registrar 10 aguas.</p>
                        </div>
                    </div>
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