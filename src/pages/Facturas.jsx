import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import "../styles/facturasview.css";

function Facturas() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [facturas, setFacturas] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token de autenticación.");
        const res = await fetch(`${API_URL}/facturas/`, {
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        });
        if (!res.ok) throw new Error("No se pudieron obtener las facturas.");
        const data = await res.json();
        setFacturas(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [API_URL]);

  const filtered = useMemo(() => {
    return facturas.filter((f) => {
      const n = (f?.nombre_cliente || "").toLowerCase();
      const matchClient = n.includes(searchTerm.toLowerCase());
      const d = new Date(f?.fecha_creacion);
      const after = !startDate || d >= new Date(startDate);
      const before = !endDate || d <= new Date(endDate);
      return matchClient && after && before;
    });
  }, [facturas, searchTerm, startDate, endDate]);

  const totalQ = useMemo(() => {
    return filtered.reduce((acc, f) => {
      const sub = (Array.isArray(f.detalles) ? f.detalles : []).reduce(
        (t, d) => t + (d.cantidad || 0) * parseFloat(d.precio_unitario || 0),
        0
      );
      return acc + sub;
    }, 0);
  }, [filtered]);

  const reset = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="facturas-container">
      <header className="facturas-header">
        <div className="logo-wrap" aria-hidden="true">
          <img src="/Logo.jpeg" alt="" />
        </div>

        <h2 className="facturas-title">Gestión de Facturas</h2>

        <button className="btn-accent" onClick={() => navigate("/crearfactura")}>
          <Plus size={18} /> Crear Factura
        </button>
      </header>

      {error && <div className="facturas-error">{error}</div>}

      {/* Filtros */}
      <div className="filtros-shell">
        <input
          type="text"
          className="filtro-input"
          placeholder="🔎 Buscar por cliente…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="date"
          className="filtro-input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="filtro-input"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="btn-clear" onClick={reset}>Limpiar</button>
      </div>

      {/* Resumen */}
      <div className="summary">
        <div className="chip">
          <span className="chip-label">Facturas</span>
          <span className="chip-value">{filtered.length}</span>
        </div>
        <div className="chip">
          <span className="chip-label">Total</span>
          <span className="chip-value">
            Q{totalQ.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="facturas-table-shell">
        <table className="facturas-table">
          <thead>
            <tr>
              <th style={{width:70}}>ID</th>
              <th style={{width:220}}>Fecha</th>
              <th style={{width:220}}>Cliente</th>
              <th>Productos</th>
              <th style={{width:160}}>Subtotal</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="empty">No hay facturas registradas</td></tr>
            ) : (
              filtered.map((f) => {
                const subtotal = (Array.isArray(f.detalles) ? f.detalles : []).reduce(
                  (t, d) => t + (d.cantidad || 0) * parseFloat(d.precio_unitario || 0),
                  0
                );
                return (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>{f.fecha_creacion ? format(new Date(f.fecha_creacion), "dd/MM/yyyy, p") : "—"}</td>
                    <td>{f.nombre_cliente || "—"}</td>
                    <td>
                      <ul className="prod-list">
                        {(f.detalles || []).map((d) => (
                          <li key={d.id}>
                            {d.producto_nombre} <span className="muted">x{d.cantidad}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      Q{subtotal.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="td-actions">
                      <button className="btn-view" onClick={() => navigate(`/verfactura/${f.id}`)}>Ver</button>
                      <button className="btn-update" onClick={() => navigate(`/editarfactura/${f.id}`)}>Actualizar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Facturas;
