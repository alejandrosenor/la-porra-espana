import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import '../App.css'
import LoadingScreen from '../components/LoadingScreen'

function Login() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const savedPlayer = localStorage.getItem('player')

        if (savedPlayer) {
            navigate('/dashboard')
        }
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const cleanCode = code.trim().toUpperCase()

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('code', cleanCode)
            .single()

        if (error || !data) {
            setError('Código incorrecto. Aquí no entra cualquiera...')
            return
        }

        localStorage.setItem('player', JSON.stringify(data))

        setLoading(true)
        setTimeout(() => {
            navigate('/dashboard')
        }, 5500)
    }

    if (loading) {
        return <LoadingScreen />
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="badge">🏆</div>

                <h1>LA PORRA</h1>
                <h2>DE ESPAÑA</h2>

                <p className="login-text">
                    Entra con tu código privado para hacer tus apuestas del Mundial.
                </p>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="text"
                        placeholder="Tu código privado"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    <button type="submit">Entrar</button>
                </form>

                {error && <p className="login-error">{error}</p>}

                <p className="login-footer">
                    Solo los miembros del grupo pueden acceder.
                </p>
            </section>
        </main>
    )
}

export default Login