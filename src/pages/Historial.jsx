import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Card, Typography, message } from "antd";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";
const { Title } = Typography;

function HistorialRegistros() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const response = await axios.get(`${API_URL}/caja-diaria/`, { headers });
      setHistorial(response.data);
    } catch {
      message.error("Error al cargar el historial");
    }
    setLoading(false);
  };

  const columns = [
    { title: "Fecha", dataIndex: "fecha_creacion", key: "fecha_creacion" },
    { title: "Banco", dataIndex: "cuenta_banco", key: "cuenta_banco" },
    { title: "Efectivo", dataIndex: "efectivo", key: "efectivo" },
    { title: "Sencillo", dataIndex: "sencillo", key: "sencillo" },
    { title: "Gastos", dataIndex: "gastos", key: "gastos" },
    { title: "Ingreso Extra", dataIndex: "ingreso_extra", key: "ingreso_extra" },
    { title: "Comentario", dataIndex: "comentario", key: "comentario" },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-blue-300">📜 Historial de Registros</Title>
      <Link to="/administrador" className="text-blue-400 underline">⬅ Volver al Administrador</Link>
      <Card className="w-full max-w-6xl mt-6">
        <Table dataSource={historial} columns={columns} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

export default HistorialRegistros;
