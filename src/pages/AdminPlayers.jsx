import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminPlayers() {
    const navigate = useNavigate()
    const currentPlayer = JSON.parse(localStorage.getItem('player'))

    const [players, setPlayers] = useState([])
    const [editingPlayer, setEditingPlayer] = useState(null)

    const [name, setName] = useState('')
    const [avatar, setAvatar] = useState('')
    const [code, setCode] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (!currentPlayer?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadPlayers()
    }, [])

    async function loadPlayers() {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name')

        if (error) {
            console.log(error)
            alert('Error cargando jugadores')
            return
        }

        setPlayers(data || [])
    }

    function startEditing(player) {
        setEditingPlayer(player)
        setName(player.name)
        setAvatar(player.avatar)
        setCode(player.code)
        setIsAdmin(player.is_admin)
    }

    function cancelEditing() {
        setEditingPlayer(null)
        setName('')
        setAvatar('')
        setCode('')
        setIsAdmin(false)
    }

    async function savePlayer() {
        if (!editingPlayer) return

        if (!name || !avatar || !code) {
            alert('Nombre, avatar y código son obligatorios')
            return
        }

        const confirmed = confirm(
            `¿Guardar cambios en ${editingPlayer.name}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('players')
            .update({
                name: name.trim(),
                avatar: avatar.trim(),
                code: code.trim().toUpperCase(),
                is_admin: isAdmin
            })
            .eq('id', editingPlayer.id)

        if (error) {
            console.log(error)
            alert('Error guardando jugador. Revisa que el código no esté repetido.')
            return
        }

        const localPlayer = JSON.parse(localStorage.getItem('player'))

        if (localPlayer?.id === editingPlayer.id) {
            localStorage.setItem(
                'player',
                JSON.stringify({
                    ...localPlayer,
                    name: name.trim(),
                    avatar: avatar.trim(),
                    code: code.trim().toUpperCase(),
                    is_admin: isAdmin
                })
            )
        }

        alert('Jugador actualizado')
        cancelEditing()
        loadPlayers()
    }

    async function deletePlayer(player) {
        const confirmed = confirm(
            `¿Seguro que quieres eliminar a ${player.name}? Se borrarán también sus apuestas.`
        )

        if (!confirmed) return

        const secondConfirm = confirm(
            'Última confirmación: esta acción no se puede deshacer.'
        )

        if (!secondConfirm) return

        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', player.id)

        if (error) {
            console.log(error)
            alert('Error eliminando jugador')
            return
        }

        alert('Jugador eliminado')
        loadPlayers()
    }

    return (
        <main className="admin-create-page">
            <header className="admin-create-header">
                <button onClick={() => navigate('/dashboard')}>
                    ←
                </button>

                <div>
                    <p>Centro de control</p>
                    <h1>Jugadores</h1>
                </div>
            </header>

            {!editingPlayer && (
                <section className="admin-create-card">
                    <div className="section-title-row">
                        <h2>Editar jugadores</h2>
                        <span>{players.length} jugadores</span>
                    </div>

                    <div className="admin-security-warning">
                        <strong>🔒 INFORMACIÓN IMPORTANTE</strong>

                        <p>
                            Los códigos de acceso son privados y pertenecen a cada jugador.
                        </p>

                        <p>
                            Los administradores pueden visualizarlos únicamente para tareas de
                            mantenimiento como editar (cambiar el emoji, hacer administrador o modificar la contraseña) o eliminar jugadores solo si fuera necesario.
                        </p>

                        <p>
                            La aplicación está diseñada bajo un sistema de confianza entre amigos.
                            Los administradores no deben utilizar códigos ajenos para acceder a
                            otros perfiles.
                        </p>
                    </div>

                    <div className="admin-players-list">
                        {players.map((player) => (
                            <article className="admin-player-row" key={player.id}>
                                <div>
                                    <strong>
                                        {player.avatar} {player.name}
                                    </strong>

                                    <p>
                                        {player.is_admin ? 'Admin' : 'Jugador'} · {player.points} pts
                                    </p>

                                    <small>
                                        Código: {player.code}
                                    </small>
                                </div>

                                <div className="admin-player-actions">
                                    <button onClick={() => startEditing(player)}>
                                        Editar
                                    </button>

                                    <button
                                        className="delete-mini-button"
                                        onClick={() => deletePlayer(player)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {editingPlayer && (
                <section className="admin-create-card">
                    <div className="section-title-row">
                        <h2>Editando</h2>
                        <span>{editingPlayer.avatar} {editingPlayer.name}</span>
                    </div>

                    <label>
                        Nombre
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>

                    <label>
                        Avatar
                        <input
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                        />
                    </label>

                    <label>
                        Código privado
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                        />
                    </label>

                    <label className="admin-checkbox-row">
                        <input
                            type="checkbox"
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                        />
                        Hacer admin
                    </label>

                    <div className="match-preview-card">
                        <p>Vista previa</p>
                        <strong>
                            {avatar} {name}
                        </strong>
                        <span>
                            {isAdmin ? 'Admin' : 'Jugador'} · Código: {code}
                        </span>
                    </div>

                    <div className="admin-create-actions">
                        <button
                            className="cancel-create-button"
                            onClick={cancelEditing}
                        >
                            Cancelar
                        </button>

                        <button
                            className="create-match-button"
                            onClick={savePlayer}
                        >
                            Guardar cambios
                        </button>
                    </div>
                </section>
            )}
        </main>
    )
}

export default AdminPlayers