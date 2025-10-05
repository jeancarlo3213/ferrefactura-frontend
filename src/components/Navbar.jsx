import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { isAuthenticated, logout } from "../api/auth";
import "@/styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    const handleStorageChange = () => setAuthenticated(isAuthenticated());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    setAuthenticated(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">FerreFactura</Link>
      {authenticated ? (
        <button onClick={handleLogout}>Cerrar sesión</button>
      ) : (
        <Link to="/login">Iniciar sesión</Link>
      )}
    </nav>
  );
}

export default Navbar;
