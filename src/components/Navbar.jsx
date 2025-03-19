import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../api/auth';
import "@/styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  return (
    <nav>
      <Link to='/'>Inicio</Link>
      {isAuthenticated() ? (
        <>
          <Link to='/dashboard'>Dashboard</Link>
          <button onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</button>
        </>
      ) : (
        <Link to='/login'>Iniciar sesión</Link>
      )}
    </nav>
  );
}
export default Navbar;