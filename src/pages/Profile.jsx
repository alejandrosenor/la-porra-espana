import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import '../App.css'

function Profile() {
    const navigate = useNavigate()
    const player = JSON.parse(localStorage.getItem('player'))

    function logout() {
        localStorage.removeItem('player')
        navigate('/login')
    }

    return (
        <main className="profile-page with-bottom-nav">
            <section className="profile-card">
                <div className="profile-avatar">
                    {player?.avatar}
                </div>

                <h1>{player?.name}</h1>
                <p>Jugador de La Porra de España</p>

                <button onClick={logout}>
                    Cerrar sesión
                </button>
            </section>

            <BottomNav />
        </main>
    )
}

export default Profile