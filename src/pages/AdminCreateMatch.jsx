import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminCreateMatch() {
    const navigate = useNavigate()

    const [rival, setRival] = useState('')
    const [flag, setFlag] = useState('')
    const [stage, setStage] = useState('Fase de grupos')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')

    const stages = [
        'Fase de grupos',
        'Dieciseisavos',
        'Octavos de final',
        'Cuartos de final',
        'Semifinal',
        'Final'
    ]

    async function createMatch() {
        if (!rival || !flag || !stage || !date || !time) {
            alert('Completa todos los campos')
            return
        }

        const confirmed = confirm('¿Seguro que quieres crear este partido?')
        if (!confirmed) return

        const matchDate = `${date} ${time}:00`

        const closingDate = new Date(matchDate)
        closingDate.setMinutes(closingDate.getMinutes() - 5)

        const { data: matches } = await supabase
            .from('matches')
            .select('match_order')
            .order('match_order', { ascending: false })
            .limit(1)

        const nextOrder =
            matches?.length > 0 && matches[0].match_order
                ? matches[0].match_order + 1
                : 1

        const { error } = await supabase
            .from('matches')
            .insert({
                rival: rival.trim(),
                rival_flag: flag.trim(),
                stage,
                match_date: matchDate,
                closing_date: closingDate.toISOString(),
                status: 'pending',
                match_order: nextOrder
            })

        if (error) {
            console.log(error)
            alert('Error creando partido')
            return
        }

        alert('Partido creado 🏆')
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
                    <h1>Nuevo partido</h1>
                </div>
            </header>

            <section className="admin-create-card">
                <label>
                    Rival
                    <input
                        placeholder="Ej: Francia"
                        value={rival}
                        onChange={(e) => setRival(e.target.value)}
                    />
                </label>

                <label>
                    Bandera del rival
                    <input
                        placeholder="Ej: 🇫🇷"
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                    />
                </label>

                <label>
                    Fase
                    <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                    >
                        {stages.map((stageOption) => (
                            <option key={stageOption} value={stageOption}>
                                {stageOption}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="admin-create-grid">
                    <label>
                        Fecha
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </label>

                    <label>
                        Hora
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </label>
                </div>

                {rival && flag && date && time && (
                    <div className="match-preview-card">
                        <p>Vista previa</p>
                        <strong>
                            🇪🇸 España vs {flag} {rival}
                        </strong>
                        <span>
                            {stage} · {date} · {time}
                        </span>
                    </div>
                )}

                <div className="admin-create-actions">
                    <button
                        className="cancel-create-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancelar
                    </button>

                    <button
                        className="create-match-button"
                        onClick={createMatch}
                    >
                        Crear partido
                    </button>
                </div>
            </section>
        </main>
    )
}

export default AdminCreateMatch