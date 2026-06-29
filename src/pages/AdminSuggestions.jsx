import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminSuggestions() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [suggestions, setSuggestions] = useState([])

    useEffect(() => {
        if (!player?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadSuggestions()
    }, [])

    async function loadSuggestions() {
        const { data, error } = await supabase
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

        if (error) {
            console.log(error)
            alert('Error cargando sugerencias')
            return
        }

        setSuggestions(data || [])
    }

    async function updateSuggestionStatus(id, status) {
        const { error } = await supabase
            .from('suggestions')
            .update({ status })
            .eq('id', id)

        if (error) {
            console.log(error)
            alert('Error actualizando sugerencia')
            return
        }

        loadSuggestions()
    }

    function getStatusLabel(status) {
        if (status === 'pending') return 'Pendiente'
        if (status === 'reviewing') return 'En revisión'
        if (status === 'approved') return 'Aprobada'
        if (status === 'done') return 'Implementada'
        if (status === 'rejected') return 'Rechazada'
        return status
    }

    return (
        <main className="admin-create-page">
            <header className="admin-create-header">
                <button onClick={() => navigate('/dashboard')}>←</button>

                <div>
                    <p>Centro de control</p>
                    <h1>Sugerencias 💡</h1>
                </div>
            </header>

            <section className="admin-create-card">
                <div className="admin-message-info">
                    <strong>💡 Buzón de sugerencias</strong>
                    <p>
                        Aquí puedes revisar las ideas que mandan los jugadores y cambiar su estado.
                    </p>
                </div>

                <div className="admin-suggestions-list">
                    {suggestions.length === 0 ? (
                        <p className="empty-history">
                            Todavía no hay sugerencias.
                        </p>
                    ) : (
                        suggestions.map((suggestion) => (
                            <article className="admin-suggestion-card" key={suggestion.id}>
                                <div>
                                    <span className={`suggestion-status ${suggestion.status}`}>
                                        {getStatusLabel(suggestion.status)}
                                    </span>

                                    <h2>{suggestion.title}</h2>

                                    {suggestion.description && (
                                        <p>{suggestion.description}</p>
                                    )}

                                    <small>
                                        {suggestion.players?.avatar} {suggestion.players?.name}
                                    </small>
                                </div>

                                <div className="suggestion-admin-actions">
                                    <button onClick={() => updateSuggestionStatus(suggestion.id, 'reviewing')}>
                                        👀 Revisando
                                    </button>

                                    <button onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}>
                                        ✅ Aprobar
                                    </button>

                                    <button onClick={() => updateSuggestionStatus(suggestion.id, 'done')}>
                                        🚀 Hecha
                                    </button>

                                    <button onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}>
                                        ❌ Rechazar
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>
        </main>
    )
}

export default AdminSuggestions