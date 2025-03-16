import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Card, Descriptions, Divider, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";

function VerFacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (!response.ok) {
          throw new Error("Error al obtener la factura.");
        }
        const data = await response.json();
        setFactura(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFactura();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Spin tip="Cargando factura..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert message="Error" description={error} type="error" showIcon closable />
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert message="Factura no encontrada" description={`No se encontró la factura con ID ${id}.`} type="warning" showIcon />
      </div>
    );
  }

  const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles } = factura;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      {/* 🖨 Sección imprimible optimizada para impresora térmica */}
      <div id="printable-area" className="print-container">
        <div className="text-center mb-4">
          {/* 🔹 Logo de la ferretería (puedes reemplazarlo con una imagen) */}
          <h1 className="text-3xl font-bold">🛠️ Ferretería El Campesino</h1>
          <p className="text-sm">📍 Dirección: Zona 1, Ciudad<br/>📞 Tel: +502 1234-5678</p>
        </div>

        <Card bordered={false} className="bg-gray-800 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Detalle de Factura #{id}</h2>

          <Descriptions bordered column={1} labelStyle={{ color: "#aaa" }} contentStyle={{ color: "#fff" }}>
            <Descriptions.Item label="Cliente">{nombre_cliente || "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Fecha Creación">{new Date(fecha_creacion).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Fecha Entrega">{fecha_entrega || "No especificada"}</Descriptions.Item>
            <Descriptions.Item label="Costo de Envío">Q{costo_envio || 0}</Descriptions.Item>
            <Descriptions.Item label="Descuento Total">Q{descuento_total || 0}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <h2 className="text-xl font-semibold mb-2">Productos</h2>
          {detalles.length === 0 ? (
            <p>No hay detalles registrados</p>
          ) : (
            detalles.map((detalle, idx) => {
              const cantidadQuintales = Math.floor(detalle.cantidad / detalle.unidades_por_quintal);
              const cantidadUnidades = detalle.cantidad % detalle.unidades_por_quintal;
              return (
                <div key={idx} className="flex justify-between items-center p-2 mb-2 bg-gray-700 rounded">
                  <span>{detalle.producto_nombre} ({detalle.categoria})</span>
                  {detalle.unidades_por_quintal ? (
                    <>
                      <span>Quintales: {cantidadQuintales}</span>
                      <span>Unidades: {cantidadUnidades}</span>
                      <span>Precio Quintal: Q{detalle.precio_quintal}</span>
                    </>
                  ) : (
                    <span>Cantidad: {detalle.cantidad}</span>
                  )}
                  <span>Subtotal: Q{(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</span>
                </div>
              );
            })
          )}
        </Card>

        <h2 className="text-center mt-4">🔹 ¡Gracias por su compra! 🔹</h2>
      </div>

      <Divider />

      {/* Botones de acción (Ocultos en la impresión) */}
      <div className="flex gap-2 no-print">
        <button onClick={() => navigate("/facturas")} className="bg-blue-500 px-3 py-2 rounded flex items-center gap-2">
          <FaArrowLeft /> Volver a Facturas
        </button>

        <button onClick={handlePrint} className="bg-green-500 px-3 py-2 rounded flex items-center gap-2">
          <FaPrint /> Imprimir Factura
        </button>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
