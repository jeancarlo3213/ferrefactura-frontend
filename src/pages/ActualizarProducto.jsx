import React, { useState, useEffect } from "react";
import { Form, Input, InputNumber, Button, Select, Card, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

function ActualizarProducto() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://127.0.0.1:8000/api/productos/", {
          headers: { Authorization: `Token ${token}` },
        });

        if (!response.ok) throw new Error("Error al obtener los productos.");
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        message.error(error.message);
      }
    };

    fetchProductos();
  }, []);

  const onFinish = async (values) => {
    if (!productoSeleccionado) {
      message.error("Seleccione un producto.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/productos/${productoSeleccionado}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("No se pudo actualizar el producto.");

      message.success("Producto actualizado con éxito.");
      navigate("/productos");
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-6">
      <Card className="w-full max-w-lg bg-gray-800 text-white shadow-lg">
        <Title level={2} className="text-center text-yellow-400">
          Actualizar Producto
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label={<span className="text-yellow-300">Seleccionar Producto</span>}>
            <Select
              showSearch
              placeholder="Buscar producto..."
              onChange={(value) => setProductoSeleccionado(value)}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {productos.map((prod) => (
                <Option key={prod.id} value={prod.id}>
                  {prod.nombre} (ID: {prod.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={<span className="text-yellow-300">Nuevo Nombre</span>} name="nombre">
            <Input placeholder="Nuevo nombre (opcional)" />
          </Form.Item>

          <Form.Item label={<span className="text-yellow-300">Nuevo Precio (Q)</span>} name="precio">
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item label={<span className="text-yellow-300">Nuevo Stock</span>} name="stock">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} className="w-full bg-yellow-500">
            Actualizar Producto
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default ActualizarProducto;
