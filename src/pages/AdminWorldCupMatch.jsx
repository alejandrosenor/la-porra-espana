import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function AdminWorldCupMatch() {
    const navigate = useNavigate()
    const { id } = useParams()
    const player = JSON.parse(localStorage.getItem('player'))

    const [match, setMatch] = useState(null)
    const [homeGoals, setHomeGoals] = useState(0)
    const [awayGoals, setAwayGoals] = useState(0)

    useEffect(() => {
        if (!player?.is_admin) {
            navigate('/dashboard')
            return
        }

        loadMatch()
    }, [])

    async function loadMatch() {
        const { data, error } = await supabase
            .from('world_cup_matches')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.log(error)
            alert('Error cargando partido')
            navigate('/world-cup')
            return
        }

        setMatch(data)
        setHomeGoals(data.home_goals ?? 0)
        setAwayGoals(data.away_goals ?? 0)
    }

    async function saveResult() {
        const confirmed = confirm(
            `¿Guardar resultado ${match.home_team} ${homeGoals}-${awayGoals} ${match.away_team}?`
        )

        if (!confirmed) return

        const { error } = await supabase
            .from('world_cup_matches')
            .update({
                home_goals: homeGoals,
                away_goals: awayGoals,
                status: 'closed'
            })
            .eq('id', match.id)

        if (error) {
            console.log(error)
            alert('Error guardando resultado')
            return
        }

        alert('Resultado actualizado 🏆')
        navigate('/world-cup')
    }

    async function reopenMatch() {
        const confirmed = confirm('¿Reabrir este partido y quitar el resultado?')
        if (!confirmed) return

        const { error } = await supabase
            .from('world_cup_matches')
            .update({
                home_goals: null,
                away_goals: null,
                status: 'scheduled'
            })
            .eq('id', match.id)

        if (error) {
            console.log(error)
            alert('Error reabriendo partido')
            return
        }

        alert('Partido reabierto')
        navigate('/world-cup')
    }

    if (!match) return <h1>Cargando...</h1>

    return (
        <main className="match-page">
            <header className="match-header">
                <button onClick={() => navigate('/world-cup')}>←</button>
                <h1>Actualizar resultado</h1>
            </header>

            <section className="bet-card">
                <h2>
                    {match.home_flag} {match.home_team} vs {match.away_flag} {match.away_team}
                </h2>

                <p className="rules">
                    Este resultado actualizará automáticamente la clasificación del grupo.
                </p>

                <div className="score-picker">
                    <button onClick={() => setHomeGoals(Math.max(0, homeGoals - 1))}>−</button>
                    <span>{homeGoals}</span>
                    <button onClick={() => setHomeGoals(homeGoals + 1)}>+</button>

                    <strong>-</strong>

                    <button onClick={() => setAwayGoals(Math.max(0, awayGoals - 1))}>−</button>
                    <span>{awayGoals}</span>
                    <button onClick={() => setAwayGoals(awayGoals + 1)}>+</button>
                </div>

                <button className="save-bet" onClick={saveResult}>
                    Guardar resultado
                </button>

                {match.status === 'closed' && (
                    <button className="delete-match-button" onClick={reopenMatch}>
                        Reabrir partido
                    </button>
                )}
            </section>
        </main>
    )
}

export default AdminWorldCupMatch