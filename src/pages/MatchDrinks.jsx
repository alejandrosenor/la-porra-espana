import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function MatchDrinks() {
    const navigate = useNavigate()
    const { id } = useParams()
    const player = JSON.parse(localStorage.getItem('player'))

    const [match, setMatch] = useState(null)
    const [beers, setBeers] = useState(0)
    const [drinks, setDrinks] = useState(0)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data: matchData } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single()

        const { data: drinksData } = await supabase
            .from('drinks')
            .select('*')
            .eq('player_id', player.id)
            .eq('match_id', id)
            .maybeSingle()

        setMatch(matchData)

        if (drinksData) {
            setBeers(drinksData.beers)
            setDrinks(drinksData.drinks)
        }
    }

    async function saveDrinks() {
        const { error } = await supabase
            .from('drinks')
            .upsert({
                player_id: player.id,
                match_id: id,
                beers,
                drinks
            }, {
                onConflict: 'player_id,match_id'
            })

        if (error) {
            console.log(error)
            alert('Error guardando hidratación')
            return
        }

        alert('Hidratación guardada 🍻')
        navigate('/dashboard')
    }

    if (!match) return <h1>Cargando...</h1>

    return (
        <main className="match-page">
            <header className="match-header">
                <button onClick={() => navigate('/dashboard')}>←</button>
                <h1>Hidratación</h1>
            </header>

            <section className="bet-card">
                <h2>
                    🇪🇸 España vs {match.rival_flag} {match.rival}
                </h2>

                <p className="rules">
                    🍺 Cuenta tus cervezas y copas de este partido.
                    Esto no afecta al ranking, solo a las estadísticas absurdas.
                </p>

                <div className="drink-counter-card">
                    <span>🍺</span>
                    <h3>Cervezas</h3>

                    <div className="drink-counter">
                        <button onClick={() => setBeers(Math.max(0, beers - 1))}>−</button>
                        <strong>{beers}</strong>
                        <button onClick={() => setBeers(beers + 1)}>+</button>
                    </div>
                </div>

                <div className="drink-counter-card">
                    <span>🥃</span>
                    <h3>Copas</h3>

                    <div className="drink-counter">
                        <button onClick={() => setDrinks(Math.max(0, drinks - 1))}>−</button>
                        <strong>{drinks}</strong>
                        <button onClick={() => setDrinks(drinks + 1)}>+</button>
                    </div>
                </div>

                <button className="save-bet" onClick={saveDrinks}>
                    Guardar contador
                </button>
            </section>
        </main>
    )
}

export default MatchDrinks