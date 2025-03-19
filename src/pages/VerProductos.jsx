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

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || String(p.id) === search
  );

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Categoría", dataIndex: "categoria" },
    { title: "Precio (Q)", dataIndex: "precio" },
    { title: "Stock", dataIndex: "stock" },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card title="Lista de Productos" className="w-full max-w-4xl bg-gray-800 text-white shadow-lg">
        <Input
          placeholder="Buscar por ID o nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <Table dataSource={filteredProductos} columns={columns} rowKey="id" />
      </Card>
    </div>
  );
}

export default VerProductos;
