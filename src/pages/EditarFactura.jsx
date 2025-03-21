import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input, Button, message } from "antd";
import { FaSave, FaArrowLeft, FaTrash, FaPlus } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

function EditarFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const response = await fetch(`${API_URL}/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("No se pudo obtener la factura.");
        const data = await response.json();
        setFactura(data);
        setProductos(data.detalles);
      } catch (error) {
        setError(error.message);
      }
    };

    const fetchProductosDisponibles = async () => {
      try {
        const response = await fetch(`${API_URL}/productos/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("No se pudieron obtener los productos.");
        const data = await response.json();
        setProductosDisponibles(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchFactura();
    fetchProductosDisponibles();
  }, [id, token]);

  const eliminarProducto = async (productoId) => {
    const productoEliminado = productos.find((p) => p.id === productoId);
    setProductos(productos.filter((p) => p.id !== productoId));

    try {
      await fetch(`${API_URL}/productos/${productoEliminado.producto}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ stock: productoEliminado.cantidad }),
      });
    } catch (error) {
      console.error("Error al actualizar stock:", error);
    }
  };

  const agregarProducto = (producto) => {
    if (producto.stock <= 0) {
      message.warning("Este producto no tiene stock disponible.");
      return;
    }
    setProductos([...productos, { ...producto, cantidad: 1 }]);
  };

  const handleUpdate = async () => {
    if (!factura) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/facturas/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          ...factura,
          detalles: productos.map((p) => ({
            producto_id: p.producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
          })),
        }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar la factura.");
      message.success("Factura actualizada correctamente");
      navigate("/facturas");
    } catch (error) {
      setError(error.message);
      message.error("Error al actualizar la factura");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!factura) return <p className="text-center text-white">Cargando factura...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Editar Factura #{id}</h2>

      <label className="block text-sm text-gray-300">Nombre del Cliente</label>
      <Input
        value={factura.nombre_cliente}
        onChange={(e) => setFactura({ ...factura, nombre_cliente: e.target.value })}
        className="border border-gray-600 bg-gray-800 text-white"
      />

      <label className="block text-sm text-gray-300 mt-4">Productos</label>
      {productos.map((producto) => (
        <div key={producto.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mt-2">
          <span>{producto.producto_nombre} (x{producto.cantidad})</span>
          <Button type="ghost" icon={<FaTrash />} onClick={() => eliminarProducto(producto.id)} className="text-red-500 hover:text-red-700" />
        </div>
      ))}

      <label className="block text-sm text-gray-300 mt-4">Agregar Producto</label>
      {productosDisponibles.map((producto) => (
        <div key={producto.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mt-2">
          <span>{producto.nombre} - Stock: {producto.stock}</span>
          <Button type="default" icon={<FaPlus />} onClick={() => agregarProducto(producto)} className="bg-blue-500 text-white border-none hover:bg-blue-600" />
        </div>
      ))}

      <div className="flex justify-between mt-6">
        <Button
          onClick={() => navigate("/facturas")}
          className="bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> Volver
        </Button>
        <Button
          onClick={handleUpdate}
          className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
          disabled={submitting}
        >
          <FaSave /> {submitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}

export default EditarFactura;
