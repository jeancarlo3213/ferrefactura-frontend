import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
// 🔸 Importamos Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [error, setError] = useState("");

  // Datos para el gráfico de barras (facturas por día)
  const [statsData, setStatsData] = useState([]);
  // Datos para el gráfico circular (facturas por mes)
  const [statsPieData, setStatsPieData] = useState([]);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;


  // Colores para cada porción del PieChart
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#ffbb28"];

  // 1) Obtener facturas
  const fetchFacturas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const response = await fetch(`${API_URL}/facturas-completas/`, {

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

  // 2) Llamar fetch una vez
  useEffect(() => {
    fetchFacturas();
  }, []);

  // 3) Calcular estadísticas cuando cambia la lista
  useEffect(() => {
    generarEstadisticas();
  }, [facturas]);

  // 🔸 Generar estadísticas diarias (para el BarChart) y mensuales (para el PieChart)
  const generarEstadisticas = () => {
    if (facturas.length === 0) {
      setStatsData([]);
      setStatsPieData([]);
      return;
    }

    // agrupar por día
    const countsPorFecha = {};
    // agrupar por mes
    const countsPorMes = {};

    facturas.forEach((factura) => {
      const fecha = new Date(factura.fecha_creacion);

      // formato día
      const fechaKey = format(fecha, "yyyy-MM-dd");
      if (!countsPorFecha[fechaKey]) {
        countsPorFecha[fechaKey] = 0;
      }
      countsPorFecha[fechaKey] += 1;

      // formato mes
      const mesKey = format(fecha, "yyyy-MM");
      if (!countsPorMes[mesKey]) {
        countsPorMes[mesKey] = 0;
      }
      countsPorMes[mesKey] += 1;
    });

    // Para el BarChart (por día)
    const stats = Object.keys(countsPorFecha).map((fechaStr) => ({
      fecha: fechaStr,
      cantidadFacturas: countsPorFecha[fechaStr],
    }));
    setStatsData(stats);

    // Para el PieChart (por mes)
    const pieStats = Object.keys(countsPorMes).map((mesStr) => ({
      mes: mesStr,
      value: countsPorMes[mesStr],
    }));
    setStatsPieData(pieStats);
  };

  // Eliminar Factura
  const eliminarFactura = async (facturaId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const response = await fetch(`${API_URL}/facturas/${facturaId}/`, {

        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la factura.");
      }

      alert("Factura eliminada con éxito.");
      fetchFacturas(); // recargar lista
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold text-center mb-4">Gestión de Facturas</h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Sección de estadísticas */}
      <h2 className="text-2xl font-bold text-center mb-4">Estadísticas de Facturas</h2>
      <div className="bg-gray-800 p-4 rounded mb-8">
        {statsData.length === 0 && statsPieData.length === 0 ? (
          <p className="text-center text-gray-400">No hay datos para mostrar.</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Gráfico de Barras (Por día) */}
            <div style={{ width: "500px", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={statsData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", border: "none" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="cantidadFacturas"
                    fill="#38bdf8"
                    label={{ position: "top", fill: "#fff" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico Circular (Por mes) */}
            <div style={{ width: "300px", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statsPieData}
                    dataKey="value"
                    nameKey="mes"
                    outerRadius={100}
                    fill="#8884d8"
                    label={(entry) => `${entry.mes} (${entry.value})`}
                  >
                    {/* Podemos usar <Cell> para colorear cada porción */}
                    {statsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", border: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Botón crear factura */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <Link
          to="/crearfactura"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} /> Crear Factura
        </Link>
      </div>

      {/* Tabla de facturas */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white uppercase">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Costo Envío</th>
              <th className="p-3">Descuento</th>
              <th className="p-3">Producto</th>
              <th className="p-3">Cantidad</th>
              <th className="p-3">Tipo Venta</th>
              <th className="p-3">Subtotal</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length > 0 ? (
              facturas.map((factura) => (
                <tr
                  key={factura.factura_id}
                  className="border-b border-gray-700 hover:bg-gray-800 transition"
                >
                  <td className="p-3">{factura.factura_id}</td>
                  <td className="p-3">
                    {format(new Date(factura.fecha_creacion), "dd/MM/yyyy, p")}
                  </td>
                  <td className="p-3">{factura.vendedor}</td>
                  <td className="p-3">{factura.nombre_cliente}</td>
                  <td className="p-3">
                    Q{parseFloat(factura.costo_envio || 0).toFixed(2)}
                  </td>
                  <td className="p-3">
                    Q{parseFloat(factura.descuento_total || 0).toFixed(2)}
                  </td>
                  <td className="p-3">{factura.producto}</td>
                  <td className="p-3">{factura.cantidad}</td>
                  <td className="p-3">{factura.tipo_venta}</td>
                  <td className="p-3">
                    Q{parseFloat(factura.subtotal).toFixed(2)}
                  </td>
                  <td className="p-3 flex gap-2">
                    {/* Ver factura */}
                    <button
                      onClick={() => navigate(`/verfactura/${factura.factura_id}`)}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                    >
                      Ver
                    </button>
                    {/* Eliminar */}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Estás seguro de eliminar la factura #${factura.factura_id}?`
                          )
                        ) {
                          eliminarFactura(factura.factura_id);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="p-3 text-center text-gray-400">
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
