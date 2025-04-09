import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import "@/styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fondo animado Vanta.js
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js";
    script.async = true;

    script.onload = () => {
      if (!vantaEffect && window.VANTA && window.VANTA.NET) {
        const effect = window.VANTA.NET({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x2563eb,
          backgroundColor: 0x0f172a,
          points: 10.0,
          maxDistance: 20.0,
        });
        setVantaEffect(effect);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api-token-auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div ref={vantaRef} className="vanta-bg">
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
    </div>
  );
}

export default Login;
