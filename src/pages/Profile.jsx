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
    const [allPlayers, setAllPlayers] = useState([])
    const [avatarType, setAvatarType] = useState(player.avatar_type || 'emoji')
    const [selectedAvatar, setSelectedAvatar] = useState(player.avatar || '')
    const [selectedSticker, setSelectedSticker] = useState(player.avatar_image_url || '')

    const AVATAR_OPTIONS = [
        // Originales
        '🦐', '🧀', '🤍', '🥊', '🦊', '🐐', '🐺', '🦁',
        '🐸', '🌸', '🦅', '🌻', '🔥', '⚡', '🍺', '🍷',
        '🥤', '⚽', '🏆', '🎯', '🧠', '👑', '🕺', '💃',

        // Animales
        '🎠', '🐼', '🐧', '🦖', '🐝',
        '🦇', '🦈', '🐍', '🦉', '🦥',
        '🐯', '🐻', '🐨', '🦘', '🦒',
        '🐗', '🦌', '🦝', '🦜', '🐬',

        // Comida y bebida
        '🍕', '🌮', '🍔', '🌭', '🍩',
        '🍟', '🍗', '🌯', '🍿', '🥨',
        '☕', '🧃', '🍹', '🍸', '🥃',

        // Deportes y competición
        '👺', '🏀', '🏈', '⚾', '🎾',
        '🏉', '🥇', '🥈', '🥉', '🏅',

        // Tecnología y objetos
        '🚀', '🛸', '🚁', '🏎️', '🛵',
        '💎', '🪙', '⛵', '📈', '💻',
        '📱', '🎮', '⌚', '🎧', '📷',

        // Personajes
        '🥷', '🧙', '🧛', '🦸', '🤖',
        '👨‍🚀', '🕵️', '🤴', '👸', '🧞',

        // Caras divertidas
        '👻', '💀', '😎', '🤡', '🤠',
        '🥳', '😈', '🤪', '🫡', '😏',

        // Aleatorios épicos
        '🌋', '🌪️', '☄️', '⭐', '🌙',
        '☀️', '🗿', '🎸', '🎹', '🎤'
    ]

    const STICKER_OPTIONS = [
        '/stickers/cucurella.png',
        '/stickers/elbicho.png',
        '/stickers/messi.png',
        '/stickers/neymar.png',
        '/stickers/mbappe.png',
        '/stickers/vini.png',
        '/stickers/haaland.png',
        '/stickers/curtois.png',
        '/stickers/mister.png',
        '/stickers/espa.png',
        '/stickers/flag.png',
        '/stickers/logo.png'
    ]

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

        const { data: playerData } = await supabase
            .from('players')
            .select('*')

        setAllPlayers(playerData || [])
        setRanking(playersData || [])
        setMyBets(betsData || [])
        setSelectedAvatar(playerData.avatar)
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

    async function saveAvatar() {
        if (avatarType === 'emoji' && isAvatarTaken(selectedAvatar)) {
            alert('Ese emoji ya lo tiene otro jugador')
            return
        }

        if (avatarType === 'sticker' && !selectedSticker) {
            alert('Selecciona un sticker primero')
            return
        }

        const { error } = await supabase
            .from('players')
            .update({
                avatar_type: avatarType,
                avatar: avatarType === 'emoji' ? selectedAvatar : null,
                avatar_image_url: avatarType === 'sticker' ? selectedSticker : null
            })
            .eq('id', player.id)

        if (error) {
            console.log(error)
            alert('Error actualizando avatar')
            return
        }

        localStorage.setItem(
            'player',
            JSON.stringify({
                ...player,
                avatar_type: avatarType,
                avatar: avatarType === 'emoji' ? selectedAvatar : null,
                avatar_image_url: avatarType === 'sticker' ? selectedSticker : null
            })
        )

        alert('Avatar actualizado')
        window.location.reload()
    }

    function isAvatarTaken(emoji) {
        return allPlayers.some(
            (p) => p.avatar === emoji && p.id !== player.id
        )
    }

    async function uploadAvatarSticker(event) {
        const file = event.target.files[0]

        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Solo puedes subir imágenes')
            return
        }

        setUploadingAvatar(true)

        const fileExt = file.name.split('.').pop()
        const fileName = `${player.id}-${Date.now()}.${fileExt}`

        const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true
            })

        if (error) {
            console.log(error)
            alert('Error subiendo sticker')
            setUploadingAvatar(false)
            return
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        setAvatarType('sticker')
        setAvatarImageUrl(data.publicUrl)
        setUploadingAvatar(false)
    }

    const streak = getCurrentStreak()

    return (
        <main className="profile-page profile-pretty-page with-bottom-nav">
            <section className="profile-hero-card">
                <div className="profile-big-avatar">
                    <div className="profile-avatar">
                        {currentPlayer.avatar_type === 'sticker' && player.avatar_image_url ? (
                            <img
                                src={player.avatar_image_url}
                                alt={player.name}
                                className="profile-avatar-sticker"
                            />
                        ) : (
                            <span>{player.avatar}</span>
                        )}
                    </div>
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

            <div className="current-avatar-preview">
                {avatarType === 'sticker' && selectedSticker ? (
                    <img src={selectedSticker} alt="Sticker seleccionado" />
                ) : (
                    <span>{selectedAvatar}</span>
                )}
            </div>

            <div className="avatar-mode-tabs">
                <button
                    className={avatarType === 'emoji' ? 'active' : ''}
                    onClick={() => setAvatarType('emoji')}
                >
                    Emoji
                </button>

                <button
                    className={avatarType === 'sticker' ? 'active' : ''}
                    onClick={() => setAvatarType('sticker')}
                >
                    Sticker
                </button>
            </div>

            {avatarType === 'emoji' && (
                <div className="avatar-options-grid">
                    {AVATAR_OPTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            disabled={isAvatarTaken(emoji)}
                            className={
                                selectedAvatar === emoji
                                    ? 'avatar-option selected'
                                    : isAvatarTaken(emoji)
                                        ? 'avatar-option taken'
                                        : 'avatar-option'
                            }
                            onClick={() => setSelectedAvatar(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {avatarType === 'sticker' && (
                <div className="sticker-options-grid">
                    {STICKER_OPTIONS.map((sticker) => (
                        <button
                            key={sticker}
                            className={
                                selectedSticker === sticker
                                    ? 'sticker-option selected'
                                    : 'sticker-option'
                            }
                            onClick={() => setSelectedSticker(sticker)}
                        >
                            <img src={sticker} alt="Sticker" />
                        </button>
                    ))}
                </div>
            )}

            <button
                className="save-avatar-button"
                onClick={saveAvatar}
            >
                Guardar avatar
            </button>

            <button className="logout-button" onClick={logout}>
                Cerrar sesión
            </button>

            <BottomNav />
        </main>
    )
}

export default Profile