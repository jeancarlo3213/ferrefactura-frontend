import React, { useState } from "react";
import { Form, Input, InputNumber, Button, Card, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL

function AgregarProducto() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      message.error("No tienes permiso para realizar esta acción.");
      setLoading(false);
      return;
    }

    // 📌 Se aseguran los valores correctos antes de enviarlos
    const productoData = {
      nombre: values.nombre.trim(),
      precio: values.precio,
      precio_unidad: values.precio, // Siempre igual a precio
      categoria: values.categoria.trim(),
      stock: values.stock,
    };

    // 🔹 Si el usuario ingresa unidades_por_quintal, entonces debe haber precio_quintal.
    if (values.unidades_por_quintal) {
      if (!values.precio_quintal) {
        message.error("Si ingresas unidades por quintal, debes ingresar el precio por quintal.");
        setLoading(false);
        return;
      }
      productoData.unidades_por_quintal = values.unidades_por_quintal;
      productoData.precio_quintal = values.precio_quintal;
    } else {
      productoData.unidades_por_quintal = null;
      productoData.precio_quintal = null;
    }

    try {
      const response = await fetch(`${API_URL}/productos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "No se pudo agregar el producto.");
      }

      message.success("✅ Producto agregado con éxito.");
      
      // 🔹 Redirige automáticamente después de 2 segundos
      setTimeout(() => navigate("/productos"), 2000);
    } catch (error) {
      message.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-6">
      <Card className="w-full max-w-lg bg-gray-800 text-white shadow-lg">
        <Title level={2} className="text-center text-blue-400">
          Agregar Producto
        </Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span className="text-blue-300">Nombre</span>}
            name="nombre"
            rules={[{ required: true, message: "Ingrese el nombre del producto" }]}
          >
            <Input placeholder="Ej: Hierro 1/2" />
          </Form.Item>

          <Form.Item
            label={<span className="text-blue-300">Precio (Q)</span>}
            name="precio"
            rules={[{ required: true, message: "Ingrese el precio del producto" }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item
            label={<span className="text-blue-300">Unidades por Quintal</span>}
            name="unidades_por_quintal"
          >
            <InputNumber min={1} className="w-full" placeholder="Opcional" />
          </Form.Item>

          <Form.Item
            label={<span className="text-blue-300">Precio por Quintal (Q)</span>}
            name="precio_quintal"
          >
            <InputNumber min={1} className="w-full" placeholder="Opcional" />
          </Form.Item>

          <Form.Item
            label={<span className="text-blue-300">Categoría</span>}
            name="categoria"
            rules={[{ required: true, message: "Ingrese la categoría" }]}
          >
            <Input placeholder="Ej: Materiales de Construcción" />
          </Form.Item>

          <Form.Item
            label={<span className="text-blue-300">Stock Inicial</span>}
            name="stock"
            rules={[{ required: true, message: "Ingrese el stock inicial" }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} className="w-full">
            Agregar Producto
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default AgregarProducto;
