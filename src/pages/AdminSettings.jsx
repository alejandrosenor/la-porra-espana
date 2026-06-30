import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminSettings() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [potAmount, setPotAmount] = useState(0)
    const [camara, setCamara] = useState(null)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [players, setPlayers] = useState([])
    const [selectedPlayerId, setSelectedPlayerId] = useState('')
    const [cardType, setCardType] = useState('yellow')
    const [cardReason, setCardReason] = useState('')
    const [disciplinaryCards, setDisciplinaryCards] = useState([])

    useEffect(() => {
        if (!player?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadSettings()
    }, [])

    async function loadSettings() {
        const { data, error } = await supabase
            .from('competition_settings')
            .select('*')
            .eq('id', 1)
            .single()

        if (error) {
            console.log(error)
            alert('Error cargando configuración')
            return
        }

        setPotAmount(data?.pot_amount || 0)

        const { data: camaraData, error: camaraError } = await supabase
            .from('players')
            .select('*')
            .eq('name', 'Cámara')
            .maybeSingle()

        if (camaraError) {
            console.log(camaraError)
            return
        }

        const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .order('name')

        setPlayers(playersData || [])

        const { data: cardsData } = await supabase
            .from('disciplinary_cards')
            .select(`
                *,
                player:players!disciplinary_cards_player_id_fkey (
                id,
                name,
                avatar,
                avatar_type,
                avatar_image_url
                )
            `)
            .order('created_at', { ascending: false })

        setDisciplinaryCards(cardsData || [])
        setCamara(camaraData)
        setPotAmount(data?.pot_amount || 0)
        setMaintenanceMode(data?.maintenance_mode || false)
    }

    async function saveSettings() {
        const confirmed = confirm(`¿Guardar bote en ${potAmount} €?`)
        if (!confirmed) return

        const { error } = await supabase
            .from('competition_settings')
            .update({
                pot_amount: Number(potAmount),
                maintenance_mode: maintenanceMode
            })
            .eq('id', 1)

        if (error) {
            console.log(error)
            alert('Error guardando configuración')
            return
        }

        alert('Configuración guardada 💰')
        navigate('/dashboard')
    }

    async function resetCamaraDrinks() {
        if (!camara) {
            alert('No encuentro a Cámara')
            return
        }

        const confirmed = confirm(
            '¿Seguro que quieres poner TODAS las bebidas de Cámara a cero?'
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('drinks')
            .update({
                beers: 0,
                drinks: 0,
                summer_wines: 0,
                soft_drinks: 0,
                waters: 0
            })
            .eq('player_id', camara.id)

        if (error) {
            console.log(error)
            alert('Error reseteando bebidas de Cámara')
            return
        }

        alert('Cámara vuelve a estar sobrio. Bebidas a cero')
    }

    async function setCamaraPenalty(value) {
        if (!camara) {
            alert('No encuentro a Cámara')
            return
        }

        const confirmed = confirm(
            value
                ? '¿Penalizar a Cámara y bloquearle todas las funciones?'
                : '¿Quitar penalización a Cámara y devolverle el acceso?'
        )

        if (!confirmed) return

        const { data, error } = await supabase
            .from('players')
            .update({
                is_penalized: value
            })
            .eq('id', camara.id)
            .select()
            .single()

        if (error) {
            console.log(error)
            alert('Error actualizando penalización')
            return
        }

        setCamara(data)

        alert(
            value
                ? 'Cámara ha sido penalizado por el administrador 🚨'
                : 'Cámara ha sido rehabilitado por el administrador ✅'
        )
    }

    async function addDisciplinaryCard() {
        if (!selectedPlayerId) {
            alert('Selecciona un jugador')
            return
        }

        if (!cardReason.trim()) {
            alert('Escribe el motivo de la tarjeta')
            return
        }

        const confirmed = confirm(
            `¿Añadir ${cardType === 'yellow' ? 'amarilla' : 'roja'} disciplinaria?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('disciplinary_cards')
            .insert({
                player_id: selectedPlayerId,
                card_type: cardType,
                reason: cardReason.trim(),
                created_by: player.id
            })

        if (error) {
            console.log(error)
            alert('Error añadiendo tarjeta')
            return
        }

        setCardReason('')
        alert('Tarjeta añadida al expediente 👮‍♂️')
        loadSettings()
    }

    async function clearPlayerCards() {
        if (!selectedPlayerId) {
            alert('Selecciona un jugador')
            return
        }

        const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

        const confirmed = confirm(
            `¿Limpiar todo el expediente disciplinario de ${selectedPlayer?.name}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('disciplinary_cards')
            .delete()
            .eq('player_id', selectedPlayerId)

        if (error) {
            console.log(error)
            alert('Error limpiando expediente')
            return
        }

        alert('Expediente limpio 😇')
        loadSettings()
    }

    async function setPlayerPenalty(value) {
        if (!selectedPlayerId) {
            alert('Selecciona un jugador')
            return
        }

        const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

        const confirmed = confirm(
            value
                ? `¿Penalizar todas las funciones de ${selectedPlayer?.name}?`
                : `¿Rehabilitar a ${selectedPlayer?.name}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('players')
            .update({ is_penalized: value })
            .eq('id', selectedPlayerId)

        if (error) {
            console.log(error)
            alert('Error actualizando penalización')
            return
        }

        alert(value ? 'Jugador penalizado 🚫' : 'Jugador rehabilitado ✅')
        loadSettings()
    }

    async function resetPlayerDrinks() {
        if (!selectedPlayerId) {
            alert('Selecciona un jugador')
            return
        }

        const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

        const confirmed = confirm(
            `¿Poner a cero todas las bebidas de ${selectedPlayer?.name}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('drinks')
            .update({
                beers: 0,
                drinks: 0,
                summer_wines: 0,
                soft_drinks: 0,
                waters: 0
            })
            .eq('player_id', selectedPlayerId)

        if (error) {
            console.log(error)
            alert('Error reseteando bebidas')
            return
        }

        alert('Bebidas reseteadas 🍻')
    }

    return (
        <main className="admin-create-page">
            <header className="admin-create-header">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Centro de control</p>
                    <h1>Configuración</h1>
                </div>
            </header>

            <section className="admin-create-card">
                <div className="admin-message-info">
                    <strong>💰 Configuración del bote</strong>

                    <p>
                        Desde aquí puedes definir el importe total del bote que verá todo el mundo en el Dashboard.
                    </p>

                    <p>
                        Si lo dejas en 0 €, la app mostrará que el bote está pendiente de definir.
                    </p>
                </div>

                <label>
                    Bote actual (€)
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={potAmount}
                        onChange={(e) => setPotAmount(e.target.value)}
                    />
                </label>

                <div className="match-preview-card">
                    <p>Vista previa</p>

                    {Number(potAmount) > 0 ? (
                        <>
                            <strong>{potAmount} €</strong>
                            <span>El ganador final se llevará el bote completo.</span>
                        </>
                    ) : (
                        <>
                            <strong>Pendiente de definir</strong>
                            <span>La organización anunciará próximamente el premio.</span>
                        </>
                    )}
                </div>

                <div className="admin-create-actions">
                    <button
                        className="cancel-create-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancelar
                    </button>

                    <button
                        className="create-match-button"
                        onClick={saveSettings}
                    >
                        Guardar configuración
                    </button>
                </div>
            </section>

            <section className="admin-create-card">
                <div className="admin-message-info">
                    <strong>🛠️ Estado de la aplicación</strong>

                    <p>
                        Activa el modo mantenimiento si necesitas bloquear temporalmente la app para todos los jugadores.
                    </p>

                    <p>
                        Los administradores podrán seguir entrando para arreglar cosas.
                    </p>
                </div>

                <button
                    className={
                        maintenanceMode
                            ? 'app-status-button maintenance'
                            : 'app-status-button online'
                    }
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                >
                    <span>
                        {maintenanceMode ? '🔴' : '🟢'}
                    </span>

                    <div>
                        <strong>
                            {maintenanceMode ? 'MANTENIMIENTO' : 'ONLINE'}
                        </strong>

                        <small>
                            {maintenanceMode
                                ? 'La app está bloqueada para jugadores'
                                : 'La app funciona con normalidad'}
                        </small>
                    </div>
                </button>
            </section>

            <section className="admin-create-card disciplinary-card">
                <div className="admin-message-info">
                    <strong>👮‍♂️ Comité Disciplinario</strong>

                    <p>
                        Desde aquí puedes añadir tarjetas, penalizar jugadores, rehabilitarlos o resetear sus bebidas.
                    </p>
                </div>

                <label>
                    Jugador
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                    >
                        <option value="">Selecciona jugador</option>

                        {players.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Tipo de tarjeta
                    <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                    >
                        <option value="yellow">🟨 Amarilla</option>
                        <option value="red">🟥 Roja</option>
                    </select>
                </label>

                <label>
                    Motivo
                    <textarea
                        placeholder="Ej: Añadir 1000 bebidas aprovechando un bug."
                        value={cardReason}
                        onChange={(e) => setCardReason(e.target.value)}
                        maxLength={250}
                    />
                </label>

                <button
                    className="create-match-button"
                    onClick={addDisciplinaryCard}
                >
                    Añadir tarjeta
                </button>

                <div className="disciplinary-actions-grid">
                    <button onClick={resetPlayerDrinks}>
                        🍻 Reset bebidas
                    </button>

                    <button onClick={() => setPlayerPenalty(true)}>
                        🚫 Penalizar
                    </button>

                    <button onClick={() => setPlayerPenalty(false)}>
                        ✅ Rehabilitar
                    </button>

                    <button onClick={clearPlayerCards}>
                        🧹 Limpiar expediente
                    </button>
                </div>

                <div className="disciplinary-history">
                    <h2>Últimas sanciones</h2>

                    {disciplinaryCards.length === 0 ? (
                        <p className="empty-history">
                            No hay sanciones todavía. Sorprendente.
                        </p>
                    ) : (
                        disciplinaryCards.slice(0, 8).map((card) => (
                            <article
                                key={card.id}
                                className={`disciplinary-history-card ${card.card_type}`}
                            >
                                <strong>
                                    {card.card_type === 'yellow' ? '🟨' : '🟥'} {card.player?.name}
                                </strong>

                                <p>{card.reason}</p>

                                <small>
                                    {new Date(card.created_at).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </small>
                            </article>
                        ))
                    )}
                </div>
            </section>

            <section className="admin-create-card camara-control-card">
                <div className="admin-message-info">
                    <strong>🚨 Panel Anti-Cámara</strong>

                    <p>
                        Herramientas especiales para controlar excesos, trampas, bugs aprovechados y demás obras de ingeniería social.
                    </p>

                    <p>
                        El botón de reseteo de bebidas le pondrá a Cámara TODAS las bebidas registradas a 0. Por si vuelve a ponerse 1000 bebidas de golpe..
                    </p>

                    <p>
                        Penalizar a Cámara implica negarle al acceso a TODAS las funciones de la aplicación, incluidas las apuestas. Si el estado aparece como "Habilitado" significa que tiene acceso a la aplicación. Si aparece como "Penalizado" significa que algo ha liado y ha sido penalizado, lo que le negará el acceso a cualquier función de la aplicación.
                    </p>

                    <p>
                        Estado actual:{' '}
                        <b>
                            {camara?.is_penalized
                                ? 'Penalizado'
                                : 'Habilitado'}
                        </b>
                    </p>
                </div>

                <button
                    className="delete-match-button"
                    onClick={resetCamaraDrinks}
                >
                    Resetear bebidas de Cámara
                </button>

                {camara?.is_penalized ? (
                    <button
                        className="create-match-button"
                        onClick={() => setCamaraPenalty(false)}
                    >
                        ✅ Rehabilitar a Cámara
                    </button>
                ) : (
                    <button
                        className="delete-match-button"
                        onClick={() => setCamaraPenalty(true)}
                    >
                        🚫 Penalizar a Cámara
                    </button>
                )}
            </section>
        </main>
    )
}

export default AdminSettings