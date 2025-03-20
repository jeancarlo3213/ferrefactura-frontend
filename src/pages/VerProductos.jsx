import React, { useEffect, useState } from "react";
import { Table, Card, Input, message } from "antd";

const API_URL = import.meta.env.VITE_API_URL;

function VerProductos() {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/productos/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("No autorizado. Verifica tu sesión.");
        }
        return res.json();
      })
      .then((data) => setProductos(data))
      .catch((err) => message.error(err.message));
  }, []);

  // 🔍 Filtrar productos por nombre o ID
  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || String(p.id) === search
  );

  // 📌 Definir las columnas de la tabla
  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
    { title: "Precio (Q)", dataIndex: "precio", key: "precio" },
    { 
      title: "Precio por Quintal (Q)", 
      dataIndex: "precio_quintal", 
      key: "precio_quintal",
      render: (value) => value ? `Q${value}` : "N/A" // Si no hay precio_quintal, muestra "N/A"
    },
    { 
      title: "Precio por Unidad (Q)", 
      dataIndex: "precio_unidad", 
      key: "precio_unidad",
      render: (value) => value ? `Q${value}` : "N/A"
    },
    { 
      title: "Unidades por Quintal", 
      dataIndex: "unidades_por_quintal", 
      key: "unidades_por_quintal",
      render: (value) => value ? value : "N/A"
    },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    { title: "Fecha Creación", dataIndex: "fecha_creacion", key: "fecha_creacion" },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card title="Lista de Productos" className="w-full max-w-6xl bg-gray-800 text-white shadow-lg">
        <Input
          placeholder="Buscar por ID o nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <Table 
          dataSource={filteredProductos} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 5 }} 
        />
      </Card>
    </div>
  );
}

export default VerProductos;
