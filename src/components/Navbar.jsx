// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../api/auth";
import "@/styles/navbar.css"; // Asegúrate de importar tu CSS donde definiremos la clase .no-print

function Navbar() {
  const navigate = useNavigate();
  return (
    // Agregamos className="navbar no-print"
    <nav className="navbar no-print">
      <Link to="/">Inicio</Link>
      {isAuthenticated() ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <Link to="/login">Iniciar sesión</Link>
      )}
    </nav>
  );
}

export default Navbar;
