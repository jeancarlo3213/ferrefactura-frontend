import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import "../styles/facturasview.css";

function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchFacturas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const response = await fetch(`${API_URL}/facturas/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error("No se pudieron obtener las facturas.");
      const data = await response.json();
      setFacturas(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const filteredFacturas = facturas.filter((factura) => {
    const matchesClient = factura.nombre_cliente
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const facturaDate = new Date(factura.fecha_creacion);
    const matchesDate =
      (!startDate || facturaDate >= new Date(startDate)) &&
      (!endDate || facturaDate <= new Date(endDate));
    return matchesClient && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="facturas-container">
      <div className="logo-wrapper">
        <img src="/Logo.jpeg" alt="Logo" className="logo-hero animate-bounce" />
      </div>

      <h2 className="facturas-title">Gestión de Facturas</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <div className="flex justify-center mb-4">
        <button
          onClick={() => navigate("/crearfactura")}
          className="btn-crear-factura"
        >
          <Plus size={18} /> Crear Factura
        </button>
      </div>

      <div className="filtros-container">
        <input
          type="text"
          placeholder="Buscar por cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filtro-input"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="filtro-input"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="filtro-input"
        />
        <button onClick={resetFilters} className="btn-borrar">
          Borrar Filtros
        </button>
      </div>

      <div className="facturas-table-container">
        <table className="facturas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacturas.length > 0 ? (
              filteredFacturas.map((factura) => (
                <tr key={factura.id}>
                  <td>{factura.id}</td>
                  <td>{format(new Date(factura.fecha_creacion), "dd/MM/yyyy, p")}</td>
                  <td>{factura.nombre_cliente}</td>
                  <td>
                    {factura.detalles.map((detalle) => (
                      <div key={detalle.id}>
                        {detalle.producto_nombre} (x{detalle.cantidad})
                      </div>
                    ))}
                  </td>
                  <td>
                    Q
                    {factura.detalles
                      .reduce(
                        (total, detalle) =>
                          total + detalle.cantidad * parseFloat(detalle.precio_unitario),
                        0
                      )
                      .toFixed(2)}
                  </td>
                  <td className="flex gap-2">
                    <button
                      onClick={() => navigate(`/verfactura/${factura.id}`)}
                      className="btn-ver"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => navigate(`/editarfactura/${factura.id}`)}
                      className="btn-actualizar"
                    >
                      Actualizar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-400 py-4">
                  No hay facturas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Facturas;
