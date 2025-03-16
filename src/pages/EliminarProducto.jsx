import React, { useState, useEffect } from "react";
import { Table, Button, Input, message, Modal, Card } from "antd";

function EliminarProducto() {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/productos/", {
        headers: { Authorization: `Token ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener los productos");
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "¿Estás seguro?",
      content: "No puedes deshacer esta acción",
      onOk: async () => {
        const token = localStorage.getItem("token");
        setLoading(true);
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/productos/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Token ${token}` },
          });
          if (!response.ok) throw new Error("Error al eliminar el producto");

          message.success("Producto eliminado");
          fetchProductos();
        } catch (error) {
          message.error(error.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || String(p.id) === search
  );

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Categoría", dataIndex: "categoria" },
    { title: "Stock", dataIndex: "stock" },
    {
      title: "Acción",
      render: (text, record) => (
        <Button danger onClick={() => handleDelete(record.id)} disabled={loading}>
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card title="Eliminar Producto" className="w-full max-w-4xl bg-gray-800 text-white shadow-lg">
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

export default EliminarProducto;
