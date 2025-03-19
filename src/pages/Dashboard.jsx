import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaBox, FaFileInvoice, FaSignOutAlt, FaChartLine, FaBars } from "react-icons/fa";
import { Card, Typography, Button } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "tailwindcss/tailwind.css";

const API_URL = import.meta.env.VITE_API_URL;
const { Title } = Typography;

function Dashboard() {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState({
    facturas_hoy: 0,
    facturas_mes: 0,
    total_ventas: 0,
    ganancias_mes: 0,
  });
  const [ventasDiarias, setVentasDiarias] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const [statsRes, dailyRes, monthlyRes] = await Promise.all([
        fetch(`${API_URL}/estadisticas-facturas/`, { headers: { Authorization: `Token ${token}` } }),
        fetch(`${API_URL}/ventas-diarias/`, { headers: { Authorization: `Token ${token}` } }),
        fetch(`${API_URL}/ventas-anuales/`, { headers: { Authorization: `Token ${token}` } })
      ]);

      if (!statsRes.ok || !dailyRes.ok || !monthlyRes.ok) throw new Error("Error al obtener datos.");

      const statsData = await statsRes.json();
      const dailyData = await dailyRes.json();
      const monthlyData = await monthlyRes.json();

      setEstadisticas(statsData);
      setVentasDiarias(formatChartData(dailyData.ventas_por_dia, "Día"));
      setVentasMensuales(formatChartData(monthlyData.ventas_por_mes, "Mes"));
    } catch (err) {
      console.error("Error al obtener datos:", err);
    }
  };

  const formatChartData = (data, label) => {
    return Object.keys(data).map(key => ({
      name: `${label} ${key}`,
      ventas: data[key] || 0
    }));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Menú lateral */}
      <div className={`bg-gray-800 transition-all duration-300 ${menuOpen ? "w-64" : "w-16"} p-4 flex flex-col`}> 
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white mb-6">
          <FaBars size={24} />
        </button>
        <nav className="flex flex-col gap-4">
          <Link to="/usuarios" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700">
            <FaUser /> {menuOpen && "Usuarios"}
          </Link>
          <Link to="/productos" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700">
            <FaBox /> {menuOpen && "Productos"}
          </Link>
          <Link to="/facturas" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700">
            <FaFileInvoice /> {menuOpen && "Facturas"}
          </Link>
          <button onClick={() => navigate("/login")} className="flex items-center gap-3 p-2 rounded-lg bg-red-600 hover:bg-red-800">
            <FaSignOutAlt /> {menuOpen && "Cerrar Sesión"}
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-6">
        <Title level={2} className="text-blue-400 text-center">Panel de Control</Title>
        
        <div className="grid grid-cols-4 gap-6 mb-6">
          {Object.entries(estadisticas).map(([key, value]) => (
            <Card key={key} className="bg-gray-800 text-white shadow-lg p-4 text-center">
              <Title level={4} className="text-blue-300">{key.replace("_", " ")}</Title>
              <Title level={3}>{value}</Title>
            </Card>
          ))}
        </div>
        
        {/* Gráficos */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-gray-800 text-white p-6 shadow-lg">
            <Title level={4} className="text-center text-blue-300 flex items-center justify-center gap-2">
              <FaChartLine /> Ventas por Día
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasDiarias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line type="monotone" dataKey="ventas" stroke="#4ade80" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          
          <Card className="bg-gray-800 text-white p-6 shadow-lg">
            <Title level={4} className="text-center text-blue-300 flex items-center justify-center gap-2">
              <FaChartLine /> Ventas por Mes
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line type="monotone" dataKey="ventas" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
