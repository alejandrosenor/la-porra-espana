import { NavLink } from 'react-router-dom'
import '../App.css'

function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/dashboard">
                🆕
                <span>Inicio</span>
            </NavLink>

            <NavLink to="/ranking">
                🏆
                <span>Ranking</span>
            </NavLink>

            <NavLink to="/world-cup">
                📅
                <span>Mundial</span>
            </NavLink>

            <NavLink to="/stats">
                📊
                <span>Estadísticas</span>
            </NavLink>

            <NavLink to="/profile">
                👤
                <span>Perfil</span>
            </NavLink>
        </nav>
    )
}

export default BottomNav