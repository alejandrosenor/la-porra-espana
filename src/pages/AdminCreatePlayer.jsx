import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminCreatePlayer() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [avatar, setAvatar] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    if (!player?.is_admin) {
        navigate('/dashboard')
        return null
    }

    function generateCode() {
        const cleanName = name
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '')

        const random = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()

        setCode(`${cleanName}-${random}`)
    }

    async function createPlayer() {
        if (!name || !code || !avatar) {
            alert('Completa nombre, código y avatar')
            return
        }

        const confirmed = confirm(
            `¿Crear jugador ${avatar} ${name} con el código ${code}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('players')
            .insert({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                avatar: avatar.trim(),
                is_admin: isAdmin,
                points: 0,
                winner_hits: 0,
                exact_hits: 0
            })

        if (error) {
            console.log(error)
            alert('Error creando jugador. Revisa que el código no exista ya.')
            return
        }

        alert('Jugador creado 🎉')
        navigate('/dashboard')
    }

    return (
        <main className="admin-create-page">
            <header className="admin-create-header">
                <button onClick={() => navigate('/dashboard')}>
                    ←
                </button>

                <div>
                    <p>Centro de control</p>
                    <h1>Nuevo jugador</h1>
                </div>
            </header>

            <section className="admin-create-card">
                <label>
                    Nombre
                    <input
                        placeholder="Ej: Luis"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <label>
                    Avatar
                    <input
                        placeholder="Ej: 🐷"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                    />
                </label>

                <label>
                    Código privado
                    <div className="code-generator-row">
                        <input
                            placeholder="Ej: LUIS-J5F1"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                        />

                        <button onClick={generateCode}>
                            Generar
                        </button>
                    </div>
                </label>

                <label className="admin-checkbox-row">
                    <input
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                    />
                    Hacer admin
                </label>

                {name && avatar && code && (
                    <div className="match-preview-card">
                        <p>Vista previa</p>
                        <strong>
                            {avatar} {name}
                        </strong>
                        <span>
                            Código: {code}
                        </span>
                    </div>
                )}

                <div className="new-player-warning">
                    <strong>⚠️ IMPORTANTE</strong>

                    <p>
                        Este jugador se incorporará con <b>0 puntos</b>, independientemente
                        de la fase del Mundial en la que se encuentre la competición.
                    </p>

                    <p>
                        No recibirá puntos retroactivos por partidos ya disputados ni por
                        apuestas no realizadas anteriormente.
                    </p>

                    <p>
                        Entrará en igualdad de condiciones para los partidos restantes,
                        pero con la desventaja lógica de haberse unido más tarde.
                    </p>

                    <p>Tendrá que ganarse la remontada...</p>
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
                        onClick={createPlayer}
                    >
                        Crear jugador
                    </button>
                </div>
            </section>
        </main>
    )
}

export default AdminCreatePlayer