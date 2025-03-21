import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";

function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // Obtener facturas
  const fetchFacturas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const response = await fetch(`${API_URL}/facturas/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudieron obtener las facturas.");
      }
      const data = await response.json();
      setFacturas(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  // Filtrar facturas por nombre de cliente y fecha
  const filteredFacturas = facturas.filter((factura) => {
    const matchesClient = factura.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const facturaDate = new Date(factura.fecha_creacion);
    const matchesDate =
      (!startDate || facturaDate >= new Date(startDate)) &&
      (!endDate || facturaDate <= new Date(endDate));
    return matchesClient && matchesDate;
  });

  // Resetear filtros
  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold text-center mb-4">Gestión de Facturas</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Filtros de búsqueda */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <input
          type="text"
          placeholder="Buscar por cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded w-64"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-1 bg-gray-800 text-white rounded w-40"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-1 bg-gray-800 text-white rounded w-40"
        />
        <button onClick={resetFilters} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Borrar Filtros</button>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white uppercase">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Productos</th>
              <th className="p-3">Subtotal</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacturas.length > 0 ? (
              filteredFacturas.map((factura) => (
                <tr key={factura.id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                  <td className="p-3">{factura.id}</td>
                  <td className="p-3">{format(new Date(factura.fecha_creacion), "dd/MM/yyyy, p")}</td>
                  <td className="p-3">{factura.nombre_cliente}</td>
                  <td className="p-3">
                    {factura.detalles.map((detalle) => (
                      <div key={detalle.id}>{detalle.producto_nombre} (x{detalle.cantidad})</div>
                    ))}
                  </td>
                  <td className="p-3">
                    Q{factura.detalles.reduce((total, detalle) => total + detalle.cantidad * parseFloat(detalle.precio_unitario), 0).toFixed(2)}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => navigate(`/verfactura/${factura.id}`)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">Ver</button>
                    <button onClick={() => navigate(`/editarfactura/${factura.id}`)} className="bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded">Actualizar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-400">No hay facturas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Facturas;
