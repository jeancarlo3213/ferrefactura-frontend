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
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const response = await fetch(`${API_URL}/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener la factura.");
        const data = await response.json();
        setFactura(data);
        setProductos(data.detalles);
      } catch (error) {
        message.error(error.message);
      }
    };

    const fetchProductosDisponibles = async () => {
      try {
        const response = await fetch(`${API_URL}/productos/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener los productos.");
        const data = await response.json();
        setProductosDisponibles(data);
      } catch (error) {
        message.error(error.message);
      }
    };

    fetchFactura();
    fetchProductosDisponibles();
  }, [id, token]);

  // ✅ Eliminar un producto de la factura y devolverlo al stock
  const eliminarProducto = (productoId) => {
    const productoEliminado = productos.find((p) => p.id === productoId);
    setProductos(productos.filter((p) => p.id !== productoId));

    // Devolver stock al producto eliminado
    fetch(`${API_URL}/productos/${productoEliminado.producto}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ stock: productoEliminado.cantidad }),
    }).catch((err) => console.error(err));
  };

  // ✅ Agregar un producto a la factura
  const agregarProducto = (producto) => {
    if (producto.stock <= 0) {
      message.warning("Este producto no tiene stock disponible.");
      return;
    }
    setProductos([...productos, { ...producto, cantidad: 1 }]);
  };

  // ✅ Actualizar factura en el backend
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
          nombre_cliente: factura.nombre_cliente,
          detalles: productos.map((p) => ({
            producto_id: p.producto,
            cantidad: p.cantidad,
            precio_unitario: p.precio_unitario,
          })),
        }),
      });
      if (!response.ok) throw new Error("Error al actualizar la factura.");
      message.success("Factura actualizada correctamente");
      navigate("/facturas");
    } catch {
      message.error("No se pudo actualizar la factura.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!factura) return <p className="text-white text-center">Cargando factura...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Editar Factura #{id}</h2>

      <label className="block text-sm text-gray-300">Nombre del Cliente</label>
      <Input
        value={factura.nombre_cliente}
        onChange={(e) => setFactura({ ...factura, nombre_cliente: e.target.value })}
        className="border border-gray-600 bg-gray-800 text-white"
      />

      <h3 className="text-xl font-semibold mt-6">Productos</h3>
      {productos.map((producto) => (
        <div key={producto.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mt-2">
          <span>{producto.producto_nombre} (x{producto.cantidad})</span>
          <Button type="ghost" icon={<FaTrash />} onClick={() => eliminarProducto(producto.id)} className="text-red-500 hover:text-red-700" />
        </div>
      ))}

      <h3 className="text-xl font-semibold mt-6">Agregar Producto</h3>
      {productosDisponibles.map((producto) => (
        <div key={producto.id} className="flex justify-between items-center bg-gray-800 p-2 rounded mt-2">
          <span>{producto.nombre} - Stock: {producto.stock}</span>
          <Button type="default" icon={<FaPlus />} onClick={() => agregarProducto(producto)} className="bg-blue-500 text-white border-none hover:bg-blue-600" />
        </div>
      ))}

      <div className="flex justify-between mt-6">
        <Button onClick={() => navigate("/facturas")} className="bg-gray-600 text-white px-4 py-2 rounded">
          <FaArrowLeft /> Volver
        </Button>
        <Button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded" disabled={submitting}>
          <FaSave /> {submitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}

export default EditarFactura;
