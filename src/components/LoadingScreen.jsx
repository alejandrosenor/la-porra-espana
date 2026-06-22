import { useEffect, useState } from 'react'
import '../App.css'

function LoadingScreen() {
    const loadingMessages = [
        'Calculando las posibilidades de Nacho...',
        'Comprobando si Adri ya ha apostado...',
        'Buscando el próximo goleador...',
        'Contando los tintos de verano...',
        'Consultando la Gaceta de La Porra...',
        'Revisando las estadísticas absurdas...',
        'Esperando a que Pilu edite su apuesta...',
        'Actualizando el bote millonario...',
        'Buscando al más hidratado...',
        'Comprobando si Ángel ha publicado prensa...',
        'Calculando la predicción colectiva...',
        'Verificando los refrescos consumidos...',
        'Detectando apuestas locas...',
        'Preparando el Mundial...',
        'Buscando nuevos stickers...',
        'Actualizando el ranking...',
        'Contando los goles de España...',
        'Preparando los titulares de mañana...',
        'Analizando quién va último...',
        'Generando polémicas deportivas...',
        'Buscando una apuesta peor que la de Dani...',
        'Comprobando si Dani sigue líder...',
        'Intentando entender la apuesta de Adri...',
        'Calculando cuántas cervezas lleva Ángel...',
        'Comprobando si Nacho acertará por fin...',
        'Generando excusas para el último del ranking...',
        'Consultando el VAR...',
        'Recontando los tintos de verano...',
        'Buscando al rey del exacto...',
        'Calculando quién invita a la siguiente ronda...',
        'Verificando los goles de Oyarzabal...',
        'Comprobando el fuera de juego de Ferrán...',
        'Calculando el récord mundial de pipas por minuto...',
        'Cargando las estadísticas absurdas...'
    ]

    const [message, setMessage] = useState('')

    useEffect(() => {
        changeMessage()

        const interval = setInterval(() => {
            changeMessage()
        }, 2000)

        return () => clearInterval(interval)
    }, [])

    function changeMessage() {
        const random =
            loadingMessages[
            Math.floor(Math.random() * loadingMessages.length)
            ]

        setMessage(random)
    }

    return (
        <div className="loading-screen">

            <div className="loading-content">

                <div className="loading-logo">
                    <img src="/stickers/logo.png" alt="La Porra del Mundial" />
                </div>

                <h1>LA PORRA DEL MUNDIAL</h1>

                <p>{message}</p>

                <div className="loading-bar">
                    <div className="loading-bar-fill"></div>
                </div>

            </div>

        </div>
    )
}

export default LoadingScreen