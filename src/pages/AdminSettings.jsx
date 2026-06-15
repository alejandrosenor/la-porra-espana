import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminSettings() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    const [potAmount, setPotAmount] = useState(0)

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
    }

    async function saveSettings() {
        const confirmed = confirm(`¿Guardar bote en ${potAmount} €?`)
        if (!confirmed) return

        const { error } = await supabase
            .from('competition_settings')
            .update({
                pot_amount: Number(potAmount)
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
        </main>
    )
}

export default AdminSettings