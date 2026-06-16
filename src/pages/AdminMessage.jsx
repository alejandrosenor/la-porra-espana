import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminMessage() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [message, setMessage] = useState('')
    const [currentMessage, setCurrentMessage] = useState(null)

    useEffect(() => {
        if (!player?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadCurrentMessage()
    }, [])

    async function loadCurrentMessage() {
        const { data, error } = await supabase
            .from('global_messages')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.log(error)
            return
        }

        setCurrentMessage(data)
    }

    async function publishMessage() {
        if (!message.trim()) {
            alert('Escribe un mensaje primero')
            return
        }

        const confirmed = confirm('¿Publicar este mensaje para todos los jugadores?')
        if (!confirmed) return

        await supabase
            .from('global_messages')
            .update({ is_active: false })
            .eq('is_active', true)

        const { error } = await supabase
            .from('global_messages')
            .insert({
                message: message.trim(),
                is_active: true
            })

        if (error) {
            console.log(error)
            alert('Error publicando mensaje')
            return
        }

        alert('Mensaje publicado 📢')
        navigate('/dashboard')
    }

    async function removeMessage() {
        const confirmed = confirm('¿Quitar el mensaje global actual?')
        if (!confirmed) return

        const { error } = await supabase
            .from('global_messages')
            .update({ is_active: false })
            .eq('is_active', true)

        if (error) {
            console.log(error)
            alert('Error quitando mensaje')
            return
        }

        alert('Mensaje quitado')
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
                    <h1>Mensaje global</h1>
                </div>
            </header>

            <section className="admin-create-card">
                {currentMessage && (
                    <div className="global-message-preview">
                        <p>Mensaje activo</p>
                        <strong>{currentMessage.message}</strong>
                    </div>
                )}

                <div className="admin-message-info">
                    <strong>¿Qué es un mensaje global?</strong>

                    <p>
                        El mensaje global aparece destacado en la pantalla principal de todos
                        los jugadores cuando abren la aplicación.
                    </p>

                    <p>
                        Puede utilizarse para avisos importantes, recordatorios de apuestas,
                        cambios de normas, información sobre próximos partidos o cualquier
                        comunicación relacionada con la porra. O no...
                    </p>

                    <p>
                        Solo puede existir un mensaje activo a la vez. Al publicar uno nuevo,
                        el anterior se sustituirá automáticamente.
                    </p>
                </div>

                <label>
                    Nuevo mensaje
                    <textarea
                        placeholder="Ej: Recordad apostar antes de las 17:55"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={300}
                    />
                </label>

                <p className="message-counter">
                    {message.length}/180 caracteres
                </p>

                <div className="admin-create-actions">
                    <button
                        className="cancel-create-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancelar
                    </button>

                    <button
                        className="create-match-button"
                        onClick={publishMessage}
                    >
                        Publicar
                    </button>
                </div>

                {currentMessage && (
                    <button
                        className="delete-match-button"
                        onClick={removeMessage}
                    >
                        Quitar mensaje actual
                    </button>
                )}
            </section>
        </main>
    )
}

export default AdminMessage