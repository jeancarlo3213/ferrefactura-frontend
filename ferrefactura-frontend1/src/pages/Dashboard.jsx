import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaBox, FaFileInvoice, FaSignOutAlt, FaClock, FaShieldAlt } from "react-icons/fa";
import { Card, Typography, Button, Modal, Input, message } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const [statsRes, dailyRes, monthlyRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/estadisticas-facturas/", { headers: { Authorization: `Token ${token}` } }),
        fetch("http://127.0.0.1:8000/api/ventas-diarias/", { headers: { Authorization: `Token ${token}` } }),
        fetch("http://127.0.0.1:8000/api/ventas-anuales/", { headers: { Authorization: `Token ${token}` } })
      ]);

      if (!statsRes.ok || !dailyRes.ok || !monthlyRes.ok) throw new Error("Error al obtener datos.");

      const statsData = await statsRes.json();
      const dailyData = await dailyRes.json();
      const monthlyData = await monthlyRes.json();

      setEstadisticas(statsData);
      setVentasDiarias(formatChartData(dailyData.ventas_por_dia, "Día"));
      setVentasMensuales(formatChartData(monthlyData.ventas_por_mes, "Mes"));
      
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const formatChartData = (data, label) => {
    return Object.keys(data).map(key => ({
      name: `${label} ${key}`,
      ventas: data[key] || 0
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAdminAccess = () => {
    setShowAdminModal(true);
  };

  const handleAdminLogin = () => {
    if (!adminPassword.trim()) {
      message.warning("Por favor, ingresa una contraseña.");
      return;
    }

    if (adminPassword === "AdminJean") {
      message.success("Acceso concedido. Redirigiendo...");
      navigate("/administrador");
    } else {
      message.error("Contraseña incorrecta. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-center text-blue-300">
        Panel de Control
      </Title>

      <div className="mb-6 text-xl font-semibold flex items-center">
        <FaClock size={24} className="mr-2" /> {new Date().toLocaleTimeString()}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Link to="/usuarios">
          <Button type="primary" icon={<FaUser />} size="large">Gestionar Usuarios</Button>
        </Link>
        <Link to="/productos">
          <Button type="primary" icon={<FaBox />} size="large">Gestionar Productos</Button>
        </Link>
        <Link to="/facturas">
          <Button type="primary" icon={<FaFileInvoice />} size="large">Gestionar Facturas</Button>
        </Link>
        <Button type="primary" danger icon={<FaSignOutAlt />} size="large" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
        <Button
          type="default"
          icon={<FaShieldAlt />}
          size="large"
          style={{ backgroundColor: "#8B5CF6", color: "white", fontWeight: "bold" }}
          onClick={handleAdminAccess}
        >
          Administrador
        </Button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-2 gap-4 bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <Card className="bg-gray-700 text-white"><Title level={3}>{estadisticas.facturas_hoy}</Title>Facturas Hoy</Card>
        <Card className="bg-gray-700 text-white"><Title level={3}>{estadisticas.facturas_mes}</Title>Facturas del Mes</Card>
        <Card className="bg-gray-700 text-white"><Title level={3}>Q {estadisticas.total_ventas.toFixed(2)}</Title>Total Ventas</Card>
        <Card className="bg-gray-700 text-white"><Title level={3}>Q {estadisticas.ganancias_mes.toFixed(2)}</Title>Ganancias del Mes</Card>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-2 gap-6 mt-6">
        <Card className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
          <Title level={4} className="text-center">📊 Ventas por Día 📊</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasDiarias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line type="monotone" dataKey="ventas" stroke="#82ca9d" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
          <Title level={4} className="text-center">📊 Ventas por Mes 📊</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line type="monotone" dataKey="ventas" stroke="#ff7300" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Modal
        title="🔒 Acceso Administrativo"
        open={showAdminModal}
        onOk={handleAdminLogin}
        onCancel={() => setShowAdminModal(false)}
        okText="Ingresar"
        cancelText="Cancelar"
      >
        <p className="text-center font-bold text-lg text-purple-600">
          ⚔️ "Estás delante del monarca." – Sung Jin-Woo ⚔️
        </p>
        <p className="text-center">Solo los administradores pueden entrar aquí.</p>
        <Input.Password
          placeholder="Ingresa la contraseña"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;
