import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Dashboard() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [matches, setMatches] = useState([])
    const [myBets, setMyBets] = useState([])
    const [allBets, setAllBets] = useState([])
    const [players, setPlayers] = useState([])
    const [globalMessage, setGlobalMessage] = useState(null)
    const [potAmount, setPotAmount] = useState(0)
    const [, setTimer] = useState(0)
    const [boardPosts, setBoardPosts] = useState([])
    const [fakePress, setFakePress] = useState('')
    const [comments, setComments] = useState([])
    const [commentTexts, setCommentTexts] = useState({})
    const [openComments, setOpenComments] = useState({})
    const [currentPlayer, setCurrentPlayer] = useState(player)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [suggestionTitle, setSuggestionTitle] = useState('')
    const [suggestionDescription, setSuggestionDescription] = useState('')
    const [disciplinaryCards, setDisciplinaryCards] = useState([])
    const [matchFilter, setMatchFilter] = useState('next')
    const [worldFinished, setWorldFinished] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(Date.now())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    async function loadData() {
        const { data: freshPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('id', player.id)
            .single()

        if (freshPlayer) {
            localStorage.setItem('player', JSON.stringify(freshPlayer))
        }

        const { data: settings } = await supabase
            .from('competition_settings')
            .select('maintenance_mode')
            .eq('id', 1)
            .single()

        const { data: matchesData } = await supabase
            .from('matches')
            .select('*')
            .order('match_order')

        const { data: myBetsData } = await supabase
            .from('bets')
            .select('*')
            .eq('player_id', player.id)

        const { data: allBetsData } = await supabase
            .from('bets')
            .select('*')

        const { data: playersData } = await supabase
            .from('players')
            .select('*')

        const { data: messageData } = await supabase
            .from('global_messages')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const { data: settingsData } = await supabase
            .from('competition_settings')
            .select('*')
            .eq('id', 1)
            .single()

        const { data: boardData } = await supabase
            .from('board_posts')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(4)

        const { data: commentsData } = await supabase
            .from('board_comments')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .order('created_at', { ascending: true })

        const { data: suggestionsData } = await supabase
            .from('suggestions')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5)

        const { data: disciplinaryData } = await supabase
            .from('disciplinary_cards')
            .select(`
                *,
                player:players!disciplinary_cards_player_id_fkey (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5)

        setDisciplinaryCards(disciplinaryData || [])
        setSuggestions(suggestionsData || [])
        setCurrentPlayer(freshPlayer)
        setMaintenanceMode(settings?.maintenance_mode || false)
        setComments(commentsData || [])
        setBoardPosts(boardData || [])
        setFakePress(
            FAKE_PRESS[Math.floor(Math.random() * FAKE_PRESS.length)]
        )
        setPotAmount(settingsData?.pot_amount || 0)
        setGlobalMessage(messageData)
        setMatches(matchesData || [])
        setMyBets(myBetsData || [])
        setAllBets(allBetsData || [])
        setPlayers(playersData || [])
        setWorldFinished(settingsData?.world_finished || false)
    }

    function hasBet(matchId) {
        return myBets.some((bet) => bet.match_id === matchId)
    }

    function getBetsCount(matchId) {
        return allBets.filter((bet) => bet.match_id === matchId).length
    }

    function allPlayersHaveBet(matchId) {
        return players.length > 0 && getBetsCount(matchId) === players.length
    }

    function shouldRevealBets(match) {
        return isBettingClosed(match)
    }

    function isBettingClosed(match) {
        if (match.status === 'closed') return true

        const now = new Date()
        const matchDate = parseMatchDate(match.match_date)
        const closingDate = new Date(matchDate)

        closingDate.setHours(closingDate.getHours() - 2)

        return now >= closingDate
    }

    function allPlayersUsedEdit(matchId) {
        const betsForMatch = allBets.filter((bet) => bet.match_id === matchId)

        if (players.length === 0) return false
        if (betsForMatch.length < players.length) return false

        return betsForMatch.every((bet) => (bet.edit_count || 0) >= 1)
    }

    function isBettingNotOpenYet(match) {
        const now = new Date()
        const openingDate = getOpeningDate(match)

        return now < openingDate
    }

    function getMatchStatus(match, betDone, notOpenYet) {
        if (match.status === 'closed') return 'Partido cerrado'
        if (allPlayersHaveBet(match.id)) return 'Apuestas reveladas'
        if (betDone) return 'Apostado'
        if (isBettingClosed(match)) return 'Apuestas cerradas'
        if (notOpenYet) return <span className="match-status-pill upcoming">
            {getOpeningCountdown(match)}
        </span>
        return 'Pendiente'
    }

    function getMissingPlayers(matchId) {
        const betsForMatch = allBets.filter(
            (bet) => bet.match_id === matchId
        )

        const playerIdsWhoBet = betsForMatch.map(
            (bet) => bet.player_id
        )

        return players.filter(
            (player) => !playerIdsWhoBet.includes(player.id)
        )
    }

    function getOpeningDate(match) {
        const matchDate = parseMatchDate(match.match_date)
        const openingDate = new Date(matchDate)
        openingDate.setDate(openingDate.getDate() - 2)
        return openingDate
    }

    function getOpeningCountdown(match) {
        const now = new Date()
        const openingDate = getOpeningDate(match)

        const difference = openingDate - now

        if (difference <= 0) {
            return 'Ya puedes apostar'
        }

        const totalSeconds = Math.floor(difference / 1000)

        const days = Math.floor(totalSeconds / 86400)
        const hours = Math.floor((totalSeconds % 86400) / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return `Se abren en ${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    function isBettingOpen(match) {
        const now = new Date()

        const matchDate = parseMatchDate(match.match_date)

        const openingDate = new Date(matchDate)
        openingDate.setDate(openingDate.getDate() - 2)

        const closingDate = new Date(matchDate)
        closingDate.setHours(closingDate.getHours() - 2)

        return now >= openingDate && now < closingDate
    }

    async function deletePost(id) {
        const confirmDelete = window.confirm(
            '¿Eliminar este anuncio?'
        )

        if (!confirmDelete) return

        await supabase
            .from('board_posts')
            .delete()
            .eq('id', id)

        loadData()
    }

    function getCommentsForPost(postId) {
        return comments.filter((comment) => comment.post_id === postId)
    }

    function toggleComments(postId) {
        setOpenComments({
            ...openComments,
            [postId]: !openComments[postId]
        })
    }

    function getCommentText(postId) {
        return commentTexts[postId] || ''
    }

    function setCommentText(postId, value) {
        setCommentTexts({
            ...commentTexts,
            [postId]: value
        })
    }

    function renderMiniAvatar(playerData) {
        if (playerData?.avatar_type === 'sticker' && playerData?.avatar_image_url) {
            return (
                <img
                    src={playerData.avatar_image_url}
                    alt={playerData.name}
                    className="comment-avatar-img"
                />
            )
        }

        return (
            <span className="comment-avatar-emoji">
                {playerData?.avatar || '👤'}
            </span>
        )
    }

    async function sendSuggestion() {
        if (!suggestionTitle.trim()) {
            alert('Pon al menos un título para la sugerencia')
            return
        }

        const { error } = await supabase
            .from('suggestions')
            .insert({
                player_id: player.id,
                title: suggestionTitle.trim(),
                description: suggestionDescription.trim() || null,
                status: 'pending'
            })

        if (error) {
            console.log(error)
            alert('Error enviando sugerencia')
            return
        }

        setSuggestionTitle('')
        setSuggestionDescription('')
        alert('Sugerencia enviada 💡')
        loadData()
    }

    async function publishComment(postId) {
        const text = getCommentText(postId).trim()

        if (!text) {
            alert('Escribe un comentario primero')
            return
        }

        if (text.length > 200) {
            alert('Máximo 200 caracteres')
            return
        }

        const { error } = await supabase
            .from('board_comments')
            .insert({
                post_id: postId,
                player_id: player.id,
                comment: text
            })

        if (error) {
            console.log(error)
            alert('Error publicando comentario')
            return
        }

        setCommentText(postId, '')

        const { data: commentsData } = await supabase
            .from('board_comments')
            .select(`
                *,
                players (
                    name,
                    avatar,
                    avatar_type,
                    avatar_image_url
                )
            `)
            .order('created_at', { ascending: true })

        setComments(commentsData || [])
    }

    async function deleteComment(comment) {
        const canDelete =
            player?.is_admin || comment.player_id === player?.id

        if (!canDelete) return

        const confirmed = confirm('¿Eliminar este comentario?')
        if (!confirmed) return

        const { error } = await supabase
            .from('board_comments')
            .delete()
            .eq('id', comment.id)

        if (error) {
            console.log(error)
            alert('Error eliminando comentario')
            return
        }

        setComments(comments.filter((item) => item.id !== comment.id))
    }

    function parseMatchDate(dateValue) {
        if (!dateValue) return null

        return new Date(dateValue.replace(' ', 'T'))
    }

    function formatMatchDate(dateValue, options) {
        const date = parseMatchDate(dateValue)

        if (!date || Number.isNaN(date.getTime())) {
            return 'Fecha pendiente'
        }

        return date.toLocaleString('es-ES', options)
    }

    const nextMatch = matches.find((match) => match.status !== 'closed')

    const FAKE_PRESS = [
        '📰 La Gaceta de La Porra: ¡España tumba a Francia y ya está en la FINAL del Mundial!',
        '📰 Marca Porra: Mbappé sigue buscando a Cucurella. El balón, mientras tanto, estuvo siempre con España.',
        '📰 Mundo Deportivo de La Porra: Francia venía con un equipazo... y se fue viendo cómo celebraba España.',
        '📰 Diario As Porra: El manotazo de Mbappé a Unai ya está siendo investigado por la FIFA. El balón, por cierto, tampoco lo encontró.',
        '📰 Mundo Porra: La mayoría apostó un 1-1. España decidió ignorar el guion y ganó 2-0.',
        '📰 Última Hora: Pilu siguió las semifinales desde Galicia. Las meigas tampoco dieron con el resultado.',
        '📰 20 Minutos Porra: Blanca, Cámara y Señor fueron los únicos en acertar a Mikel Oyarzabal como goleador.',
        '📰 El Chiringuito de La Porra: Dani Olmo, Ferran y Merino recibieron más votos que Pedro Porro... y fue Pedro quien apareció en la foto.',
        '📰 Porra Today: Pedro Porro marca en semifinales. Ningún participante sabía algo que Luis de la Fuente sí.',
        '📰 La Voz de La Porra: Blanca conserva el liderato. Sus perseguidores siguen oliendo sangre a falta de la gran final.',
        '📰 Rugby Today: Francia preguntó si todavía quedaban 80 minutos más para intentar tocar la pelota.',
        '📰 Mundo Arbitral: Mbappé vio más de cerca a Unai Simón que al balón durante gran parte del encuentro.',
        '📰 Comité Técnico: El 2-0 volvió a desmontar las predicciones colectivas de La Porra.',
        '📰 Comité Disciplinario: Adri reapareció tras tres ausencias consecutivas. La UDM confirma que la tarjeta roja sigue en su expediente.',
        '📰 Noticias FIFA: Adri regresó apostando un optimista 4-2... y con Cucurella como goleador. La fe mueve montañas.',
        '📰 Hydration News: Cámara mantiene un comportamiento ejemplar desde que la UDM le retiró las bebidas. Milagros existen.',
        '📰 Mundo Fashion: La camiseta de Cucurella de Señor y la de Lamine de Pilu siguen protagonizando el duelo textil del verano.',
        '📰 Diario de Lesiones: Nacho afrontó las semifinales con muletas tras su caída en la casa rural. Ni así dejó de apostar.',
        '📰 UEFA Insider: La final enfrentará a España contra el vencedor del Argentina-Inglaterra. Medio país ya no puede dormir.',
        '📰 La Porra Analytics: Tras cinco partidos, el resultado exacto sigue siendo el tesoro más difícil de encontrar para muchos.',
        '📰 Diario de La Final: España está a un solo partido de la gloria. La calculadora de puntos ya echa humo.',
        '📰 UEFA Insider: Cristiano abandona el Mundial. Pilu también, emocionalmente.',
        '📰 El Economista de La Porra: El bote entra en su última jornada. Las cuentas empiezan a hacerse en voz baja.',
        '📰 El Confidencial: La UDM confirma que las sanciones seguirán vigentes incluso en la final. No habrá amnistía.',
        '📰 Breaking News: Se han agotado las calculadoras intentando averiguar quién puede proclamarse campeón de La Porra.',
        '📰 La Voz del VAR: Francia pidió revisar el partido. El VAR respondió con un vídeo de los goles de España.',
        '📰 Rumores de Vestuario: Blanca ha pedido que la final empiece ya antes de que alguien le quite el liderato.',
        '📰 Mundo Mundial: España ya está donde quería estar. Ahora solo queda un último paso hacia la cuarta estrella.'
    ]

    const openMatches = matches.filter((match) => match.status !== 'closed')
    const closedMatches = matches.filter((match) => match.status === 'closed')

    function scrollToNextMatch() {
        const element = document.getElementById('next-match-card')

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }

    function getFilteredMatches() {
        if (matchFilter === 'next') {
            return openMatches
        }

        if (matchFilter === 'closed') {
            return closedMatches
        }

        if (matchFilter === 'spain') {
            return matches.filter(
                (match) =>
                    match.home_team === 'España' ||
                    match.away_team === 'España' ||
                    match.rival
            )
        }

        if (matchFilter === 'knockout') {
            return matches.filter(
                (match) =>
                    match.stage !== 'Fase de grupos' &&
                    !match.stage?.toLowerCase().includes('grupo')
            )
        }

        return matches
    }

    function getMatchStageClass(match) {
        const stage = match.stage?.toLowerCase() || ''

        if (stage.includes('semi')) return 'stage-semis'
        if (stage.includes('cuartos')) return 'stage-quarters'
        if (stage.includes('octavos')) return 'stage-round16'
        if (stage.includes('dieciseisavos')) return 'stage-round32'
        if (stage === 'final') return 'stage-final'
        if (stage.includes('grupo')) return 'stage-groups'

        return ''
    }

    const visibleMatches = getFilteredMatches()

    if (currentPlayer?.is_penalized) {
        return (
            <main className="penalized-page">
                <section className="penalized-card">
                    <span>🚫</span>
                    <h1>Acceso penalizado</h1>
                    <p>
                        Usted está penalizado por el administrador para todas las funciones de esta aplicación.
                    </p>
                </section>
            </main>
        )
    }

    if (maintenanceMode && !player?.is_admin) {
        return (
            <main className="maintenance-page">

                <section className="maintenance-card">

                    <span>🛠️</span>

                    <h1>Aplicación en mantenimiento</h1>

                    <p>
                        Estamos realizando mejoras en La Porra del Mundial.
                    </p>

                    <p>
                        Vuelve a intentarlo dentro de unos minutos.
                    </p>

                </section>

            </main>
        )
    }

    return (
        <main className="dashboard-page dashboard-home with-bottom-nav">
            <section className="home-hero">
                <div>
                    <p className="home-kicker">La Porra de España</p>
                    <h1>
                        <h1 className="home-player-name">

                            {player?.avatar_type === 'sticker' &&
                                player?.avatar_image_url ? (
                                <img
                                    src={player.avatar_image_url}
                                    alt={player.name}
                                    className="home-player-avatar"
                                />
                            ) : (
                                player?.avatar
                            )}

                            {player?.name}

                        </h1>
                    </h1>
                </div>

                <button
                    className="hero-ranking-button"
                    onClick={() => navigate('/ranking')}
                >
                    🏆 Ranking
                </button>

                <button
                    className="hero-ranking-button"
                    onClick={scrollToNextMatch}
                >
                    🎯 Ir al próximo partido
                </button>

                {player?.is_admin && (
                    <button
                        className="hero-admin-button"
                        onClick={() => navigate('/admin/create-match')}
                    >
                        ➕ Nuevo partido
                    </button>
                )}

                {player?.is_admin && (
                    <button
                        className="hero-admin-button"
                        onClick={() => navigate('/admin/create-player')}
                    >
                        👤 Nuevo jugador
                    </button>
                )}

                {player?.is_admin && (
                    <button
                        className="hero-admin-button"
                        onClick={() => navigate('/admin/players')}
                    >
                        ✏️ Editar jugadores
                    </button>
                )}

                {player?.is_admin && (
                    <button
                        className="hero-admin-button"
                        onClick={() => navigate('/admin/message')}
                    >
                        📢 Mensaje global
                    </button>
                )}

                {player?.is_admin && (
                    <button className="hero-admin-button" onClick={() => navigate('/admin/suggestions')}>
                        💡 Sugerencias
                    </button>
                )}

                {player?.is_admin && (
                    <button
                        className="hero-admin-button"
                        onClick={() => navigate('/admin/settings')}
                    >
                        ⚙️ Configuración
                    </button>
                )}
            </section>

            {globalMessage && (
                <section className="dashboard-global-message">
                    <span>📢 Aviso (realizado por el administrador)</span>
                    <p>{globalMessage.message}</p>
                </section>
            )}

            <section className="rules-card">
                <div>
                    <span>📜</span>

                    <div>
                        <strong>Reglamento oficial de La Porra</strong>

                        <p>
                            Puntos, apuestas, goleadores, bote, rachas, hidratación, etc.
                        </p>
                    </div>
                </div>

                <button onClick={() => navigate('/rules')}>
                    Ver reglas
                </button>
            </section>

            {worldFinished && (
                <section className="museum-open-card">
                    <span>🏛️</span>

                    <div>
                        <p>Mundial finalizado</p>
                        <h2>El Museo del Mundial 2026 ya está abierto</h2>
                        <small>
                            Revive la clasificación final, premios, sanciones, mejores apuestas y recuerdos de La Porra.
                        </small>
                    </div>

                    <button onClick={() => navigate('/world-cup')}>
                        Entrar al Museo
                    </button>
                </section>
            )}

            {nextMatch && (
                <section className="next-match-card">
                    <p className="next-label">Próximo partido</p>

                    <h2>
                        🇪🇸 España vs {nextMatch.rival_flag} {nextMatch.rival}
                    </h2>

                    <p className="next-date">
                        {formatMatchDate(nextMatch.match_date, {
                            day: '2-digit',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </section>
            )}

            <section className="suggestions-card">
                <div className="section-title-row">
                    <h2>💡 Buzón de sugerencias</h2>
                    <span>Ideas para la app</span>
                </div>

                <p className="suggestions-intro">
                    ¿Se te ocurre una mejora, una tontería o una nueva estadística absurda?
                    Déjala aquí para que el comité la estudie.
                </p>

                <input
                    type="text"
                    placeholder="Título de la sugerencia"
                    value={suggestionTitle}
                    onChange={(e) => setSuggestionTitle(e.target.value)}
                />

                <textarea
                    placeholder="Explica un poco la idea..."
                    value={suggestionDescription}
                    onChange={(e) => setSuggestionDescription(e.target.value)}
                />

                <button onClick={sendSuggestion}>
                    Enviar sugerencia
                </button>

                {suggestions.length > 0 && (
                    <div className="suggestions-list">
                        {suggestions.map((suggestion) => (
                            <article key={suggestion.id}>
                                <strong>{suggestion.title}</strong>
                                {suggestion.description && (
                                    <p>{suggestion.description}</p>
                                )}
                                <small>
                                    {suggestion.players?.avatar} {suggestion.players?.name} · Pendiente
                                </small>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="world-board">
                <div className="world-board-header">
                    <div>
                        <span>📢</span>
                        <div>
                            <h2>Tablón del Mundial</h2>
                            <p>Anuncios, noticias y prensa absurda de La Porra.</p>
                        </div>
                    </div>

                    <button onClick={() => navigate('/admin/board/new')}>
                        Publicar
                    </button>
                </div>

                <article className="press-card">
                    <span>🗞️ Prensa de La Porra</span>
                    <p>{fakePress}</p>
                </article>

                {boardPosts.length === 0 ? (
                    <article className="board-empty-card">
                        <strong>Sin anuncios todavía</strong>
                        <p>Cuando un admin publique algo aparecerá aquí.</p>
                    </article>
                ) : (
                    <div className="board-posts-list">
                        {boardPosts.map((post) => (
                            <article className="board-post-card" key={post.id}>
                                {(player?.is_admin || post.created_by === player?.id) && (
                                    <button
                                        className="delete-post-btn"
                                        onClick={() => deletePost(post.id)}
                                    >
                                        🗑️
                                    </button>
                                )}

                                {post.image_url && (
                                    <img src={post.image_url} alt={post.title} />
                                )}

                                <div>
                                    <span>
                                        {post.type === 'automatic' ? '🤖 Noticia automática' : '📣 Anuncio'}
                                    </span>

                                    <h3>{post.title}</h3>
                                    <p>{post.description}</p>

                                    <small className='board-post-meta'>
                                        {post.players?.avatar_type === 'sticker' && post.players?.avatar_image_url ? (
                                            <img
                                                src={post.players.avatar_image_url}
                                                alt={post.players.name}
                                                className="inline-player-avatar"
                                            />
                                        ) : (
                                            post.players?.avatar
                                        )}{' '}
                                        {post.players?.name || 'Sistema'}{'. '}
                                        {new Date(post.created_at).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </small>

                                    <div className="post-comments-box">
                                        <button
                                            className="comments-toggle-button"
                                            onClick={() => toggleComments(post.id)}
                                        >
                                            💬 {getCommentsForPost(post.id).length} comentarios
                                        </button>

                                        {openComments[post.id] && (
                                            <div className="comments-panel">
                                                {getCommentsForPost(post.id).length === 0 ? (
                                                    <p className="no-comments-text">
                                                        Todavía no hay comentarios. Sé el primero en meter cizaña.
                                                    </p>
                                                ) : (
                                                    <div className="comments-list">
                                                        {getCommentsForPost(post.id).map((comment) => (
                                                            <article className="comment-item" key={comment.id}>
                                                                <div className="comment-avatar">
                                                                    {renderMiniAvatar(comment.players)}
                                                                </div>

                                                                <div>
                                                                    <strong>{comment.players?.name}</strong>

                                                                    <p>{comment.comment}</p>

                                                                    <small>
                                                                        {new Date(comment.created_at).toLocaleString('es-ES', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </small>
                                                                </div>

                                                                {(player?.is_admin || comment.player_id === player?.id) && (
                                                                    <button
                                                                        className="delete-comment-button"
                                                                        onClick={() => deleteComment(comment)}
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </article>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="comment-form">
                                                    <input
                                                        placeholder="Escribe un comentario..."
                                                        value={getCommentText(post.id)}
                                                        maxLength={200}
                                                        onChange={(e) => setCommentText(post.id, e.target.value)}
                                                    />

                                                    <button onClick={() => publishComment(post.id)}>
                                                        Enviar
                                                    </button>
                                                </div>

                                                <small className="comment-counter">
                                                    {getCommentText(post.id).length}/200
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="disciplinary-home-card">
                <div className="section-title-row">
                    <h2>👮 Unidad Disciplinaria del Mundial</h2>
                    <span>Últimas sanciones</span>
                    <button
                        className="udm-rules-button"
                        onClick={() => navigate('/rules')}
                    >
                        📖 Ver reglas UDM
                    </button>
                </div>

                {disciplinaryCards.length === 0 ? (
                    <p className="empty-history">No hay sanciones. Milagro.</p>
                ) : (
                    <div className="disciplinary-home-list">
                        {disciplinaryCards.map((card) => (
                            <article key={card.id} className={card.card_type}>
                                <span>{card.card_type === 'yellow' ? '🟨' : '🟥'}</span>

                                <div>
                                    <strong>
                                        Expediente FIFA-PORRA nº{card.case_number || '---'} · {card.player?.avatar} {card.player?.name}
                                    </strong>

                                    <p>{card.reason}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="pot-card">
                <span>💰 Bote de La Porra</span>

                {potAmount > 0 ? (
                    <>
                        <strong>{potAmount} €</strong>

                        <p>
                            El ganador final de la porra se llevará el bote completo.
                        </p>
                    </>
                ) : (
                    <>
                        <strong>Pendiente de definir</strong>

                        <p>
                            La organización anunciará próximamente el premio de esta edición.
                        </p>
                    </>
                )}
            </section>

            <section className="matches-section pretty-matches" id="next-match-card">
                <div className="section-title-row">
                    <div className="matches-title-hero">
                        <div>
                            <span className="matches-kicker">⚔️ Apuestas de La Porra</span>
                            <h2>Partidos</h2>
                            <p>Elige tu apuesta, revisa horarios y prepárate para sufrir.</p>
                        </div>

                        <strong>{visibleMatches.length} partidos</strong>
                    </div>
                </div>

                <section className="match-filter-tabs">
                    <button
                        className={matchFilter === 'next' ? 'active' : ''}
                        onClick={() => setMatchFilter('next')}
                    >
                        🔜 Próximos
                    </button>

                    <button
                        className={matchFilter === 'closed' ? 'active' : ''}
                        onClick={() => setMatchFilter('closed')}
                    >
                        ✅ Finalizados
                    </button>

                    <button
                        className={matchFilter === 'knockout' ? 'active' : ''}
                        onClick={() => setMatchFilter('knockout')}
                    >
                        🏆 Eliminatorias
                    </button>

                    <button
                        className={matchFilter === 'all' ? 'active' : ''}
                        onClick={() => setMatchFilter('all')}
                    >
                        📋 Todos
                    </button>
                </section>

                {visibleMatches.map((match) => {
                    const betDone = hasBet(match.id)
                    const bettingClosed = isBettingClosed(match)
                    const revealed = shouldRevealBets(match)
                    const notOpenYet = isBettingNotOpenYet(match)
                    const statusText = getMatchStatus(match, betDone, notOpenYet)
                    const missingBets = players.length - getBetsCount(match.id)
                    const missingPlayers = getMissingPlayers(match.id)
                    const drinksBlocked = player?.name === 'Adri'

                    return (
                        <article
                            key={match.id}
                            className={`pretty-match-card ${getMatchStageClass(match)} ${match.status !== 'closed' ? 'alive' : ''}`}
                        >
                            <div className="pretty-match-main">
                                {match.stage && (
                                    <p className="match-stage">🏆 {match.stage}</p>
                                )}

                                <div className="pretty-match-teams">
                                    <div>
                                        <span className="team-flag">🇪🇸</span>
                                        <strong>España</strong>
                                        <small>ES</small>
                                    </div>

                                    <span className="match-vs">VS</span>

                                    <div>
                                        <span className="team-flag">{match.rival_flag}</span>
                                        <strong>{match.rival}</strong>
                                        <small>{match.rival_code || ''}</small>
                                    </div>
                                </div>

                                <div className="match-info-line">
                                    <span>
                                        📅 {formatMatchDate(match.match_date, {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: 'short'
                                        })}
                                    </span>

                                    <span>
                                        🕘 {formatMatchDate(match.match_date, {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {!revealed && match.status !== 'closed' && (
                                    <p className="missing-bets">
                                        {missingPlayers.length === 0
                                            ? '✅ Todos han apostado'
                                            : `Faltan ${missingPlayers.map(p => p.name).join(', ')} por apostar`}
                                    </p>
                                )}
                            </div>

                            <div className="match-actions pretty-actions">
                                <span
                                    className={
                                        match.status === 'closed'
                                            ? 'status closed-status'
                                            : revealed
                                                ? 'status done'
                                                : betDone
                                                    ? 'status done'
                                                    : bettingClosed || notOpenYet
                                                        ? 'status closed-status'
                                                        : 'status'
                                    }
                                >
                                    {statusText}
                                </span>

                                {match.status === 'closed' ? (
                                    <button onClick={() => navigate(`/match/${match.id}/bets`)}>
                                        Ver resultados
                                    </button>
                                ) : revealed ? (
                                    <button onClick={() => navigate(`/match/${match.id}/bets`)}>
                                        Ver apuestas
                                    </button>
                                ) : betDone ? (
                                    <button onClick={() => navigate(`/match/${match.id}`)}>
                                        Ver apuesta
                                    </button>
                                ) : bettingClosed ? (
                                    <button disabled>Cerradas</button>
                                ) : notOpenYet ? (
                                    <button disabled>Próximamente</button>
                                ) : (
                                    <button onClick={() => navigate(`/match/${match.id}`)}>
                                        Apostar
                                    </button>
                                )}

                                {drinksBlocked ? (
                                    <button disabled className="disabled-drinks-btn">
                                        Estás sancionado
                                    </button>
                                ) : match.status === 'closed' ? (
                                    <button disabled className="disabled-drinks-btn">
                                        Hidratado
                                    </button>
                                ) : notOpenYet ? (
                                    <button disabled className="disabled-drinks-btn">
                                        Te hidratarás
                                    </button>
                                ) : (
                                    <button
                                        className="drinks-btn"
                                        onClick={() => navigate(`/drinks/${match.id}`)}
                                    >
                                        Bebidas
                                    </button>
                                )}

                                {player?.is_admin && (
                                    <button
                                        className="admin-mini-button"
                                        onClick={() => navigate(`/admin/match/${match.id}`)}
                                    >
                                        Admin
                                    </button>
                                )}
                            </div>
                        </article>
                    )
                })}
            </section>

            <BottomNav />
        </main>
    )
}

export default Dashboard