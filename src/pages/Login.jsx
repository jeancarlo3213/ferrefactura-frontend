import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Importamos el CSS

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page"); // Agrega la clase al body cuando entra al login
    return () => document.body.classList.remove("login-page"); // La quita cuando cambia de página
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api-token-auth/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: user, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            placeholder="Usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        <div className="input-group relative">
          <label htmlFor="password">Contraseña</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-login" disabled={loading}>
          {loading ? "Cargando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default Login;
