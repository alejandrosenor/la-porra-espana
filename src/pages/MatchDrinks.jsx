import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'

function MatchDrinks() {
    const navigate = useNavigate()
    const { id } = useParams()

    const storedPlayer = localStorage.getItem('player')
    const player = storedPlayer ? JSON.parse(storedPlayer) : null

    const [match, setMatch] = useState(null)
    const [beers, setBeers] = useState(0)
    const [drinks, setDrinks] = useState(0)
    const [summerWines, setSummerWines] = useState(0)
    const [softDrinks, setSoftDrinks] = useState(0)
    const [waters, setWaters] = useState(0)

    useEffect(() => {
        if (!player) {
            navigate('/')
            return
        }

        loadData()
    }, [])

    async function loadData() {
        try {
            console.log('PLAYER:', player)
            console.log('MATCH ID:', id)

            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .eq('id', id)
                .single()

            if (matchError) throw matchError

            const { data: drinksData, error: drinksError } = await supabase
                .from('drinks')
                .select('*')
                .eq('player_id', player.id)
                .eq('match_id', id)
                .maybeSingle()

            if (drinksError) throw drinksError

            setMatch(matchData)

            if (drinksData) {
                setBeers(drinksData.beers || 0)
                setDrinks(drinksData.drinks || 0)
                setSummerWines(drinksData.summer_wines || 0)
                setSoftDrinks(drinksData.soft_drinks || 0)
                setWaters(drinksData.waters || 0)
            }
        } catch (error) {
            console.log('ERROR EN BEBIDAS:', error)
            alert(error.message || 'Error desconocido en bebidas')
            navigate('/dashboard')
        }
    }

    function isLocked() {
        return match?.status === 'closed'
    }

    async function saveDrinks() {
        if (!player) {
            navigate('/')
            return
        }

        if (isLocked()) {
            alert('Este partido ya está cerrado. Te hidrataste bien')
            return
        }

        const { error } = await supabase
            .from('drinks')
            .upsert({
                player_id: player.id,
                match_id: id,
                beers,
                drinks,
                summer_wines: summerWines,
                soft_drinks: softDrinks,
                waters
            }, {
                onConflict: 'player_id,match_id'
            })

        if (error) {
            console.log(error)
            alert(`Error guardando hidratación: ${error.message}`)
            return
        }

        alert('Hidratación guardada')
        navigate('/dashboard')
    }

    function CounterCard({ emoji, title, value, onMinus, onPlus }) {
        return (
            <div className="drink-counter-card">
                <span>{emoji}</span>
                <h3>{title}</h3>

                <div className="drink-counter">
                    <button disabled={isLocked()} onClick={onMinus}>−</button>
                    <strong>{value}</strong>
                    <button disabled={isLocked()} onClick={onPlus}>+</button>
                </div>
            </div>
        )
    }

    if (!match) {
        return (
            <main className="match-page">
                <h1>Cargando hidratación...</h1>
            </main>
        )
    }

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

                {isLocked() ? (
                    <p className="bet-warning">
                        🔒 Te hidrataste bien. Este contador ya está cerrado para este partido.
                    </p>
                ) : (
                    <p className="rules">
                        Cuenta lo que cae durante el partido. Esto no afecta al ranking,
                        solo a las estadísticas absurdas.<br />
                        Bebe con responsabilidad.<br />
                        O no...
                    </p>
                )}

                <CounterCard
                    emoji="🍺"
                    title="Cervezas"
                    value={beers}
                    onMinus={() => setBeers(Math.max(0, beers - 1))}
                    onPlus={() => setBeers(beers + 1)}
                />

                <CounterCard
                    emoji="🥃"
                    title="Copas"
                    value={drinks}
                    onMinus={() => setDrinks(Math.max(0, drinks - 1))}
                    onPlus={() => setDrinks(drinks + 1)}
                />

                <CounterCard
                    emoji="🍷"
                    title="Tintos de verano"
                    value={summerWines}
                    onMinus={() => setSummerWines(Math.max(0, summerWines - 1))}
                    onPlus={() => setSummerWines(summerWines + 1)}
                />

                <CounterCard
                    emoji="🥤"
                    title="Refrescos"
                    value={softDrinks}
                    onMinus={() => setSoftDrinks(Math.max(0, softDrinks - 1))}
                    onPlus={() => setSoftDrinks(softDrinks + 1)}
                />

                <CounterCard
                    emoji="💧"
                    title="Aguas"
                    value={waters}
                    onMinus={() => setWaters(Math.max(0, waters - 1))}
                    onPlus={() => setWaters(waters + 1)}
                />

                <button
                    className="save-bet"
                    onClick={saveDrinks}
                    disabled={isLocked()}
                >
                    {isLocked() ? 'Te hidrataste bien' : 'Guardar contador'}
                </button>
            </section>
        </main>
    )
}

export default MatchDrinks