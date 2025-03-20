import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

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
        const response = await fetch(`${API_URL}/facturas/${id}/`, {
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
      <div className="p-4 max-w-md mx-auto">
        <Alert message="Error" description={error} type="error" showIcon closable />
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <Alert
          message="Factura no encontrada"
          description={`No se encontró la factura con ID ${id}.`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATOS DE FACTURA
  // ─────────────────────────────────────────────────────────────────────────────
  const {
    nombre_cliente,
    fecha_creacion,
    fecha_entrega,
    costo_envio,
    descuento_total,
    detalles = [],
  } = factura;

  // Convertir valores numéricos
  const costoEnvioNum = parseFloat(costo_envio) || 0;
  const descuentoTotalNum = parseFloat(descuento_total) || 0;

  let subTotal = 0;
  detalles.forEach((item) => {
    const precio = parseFloat(item.precio_unitario) || 0;
    subTotal += item.cantidad * precio;
  });

  const total = subTotal + costoEnvioNum - descuentoTotalNum;

  const fechaCreacionStr = new Date(fecha_creacion).toLocaleString();
  const fechaEntregaStr = fecha_entrega || "No especificada";

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNCIÓN PARA IMPRIMIR
  // ─────────────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      {/* 🔹 Estilos de impresión corregidos */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto; /* 🔹 Ancho de 80mm, altura automática */
            margin: 0;
          }

          .ticket-container {
            max-width: 80mm !important;
            width: 100%;
            padding: 5px;
            font-size: 10px;
            background-color: #fff;
            color: #000;
            margin: 0 auto;
            page-break-inside: avoid;
          }

          .ticket-table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
            page-break-inside: avoid;
          }

          .ticket-summary {
            page-break-before: avoid;
            page-break-inside: avoid;
          }

          /* 🔹 Asegurar que no se divida en 2 páginas */
          .ticket-content {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          /* 🔹 Ocultar botones y navbar en la impresión */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Contenedor del ticket */}
      <div className="ticket-container">
        <div className="ticket-header">
          <h1>FERRETERÍA EL CAMPESINO</h1>
          <p>Aldea Mediacuesta</p>
          <p>Tel: +502 57765449 (Pedidos)</p>
        </div>

        <div className="ticket-box">
          <p><strong>Factura #{id}</strong></p>
          <p>Cliente: {nombre_cliente}</p>
          <p>Creación: {fechaCreacionStr}</p>
          <p>Entrega: {fechaEntregaStr}</p>
        </div>

        <table className="ticket-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant</th>
              <th>P/U</th>
              <th>Subt</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((item, idx) => (
              <tr key={idx}>
                <td>{item.producto_nombre}</td>
                <td>{item.cantidad}</td>
                <td>Q{parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td>Q{(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ticket-summary">
          <p>Subtotal: Q{subTotal.toFixed(2)}</p>
          <p>Costo Envío: Q{costoEnvioNum.toFixed(2)}</p>
          <p>Descuento: Q{descuentoTotalNum.toFixed(2)}</p>
          <p className="highlight">Total: Q{total.toFixed(2)}</p>
        </div>

        {/* Botones (ocultos en la impresión) */}
        <div className="flex gap-2 justify-center mt-4 no-print">
          <button onClick={() => navigate("/facturas")} className="bg-blue-500 px-3 py-2 rounded flex items-center gap-2">
            <FaArrowLeft /> Volver a Facturas
          </button>
          <button onClick={handlePrint} className="bg-green-500 px-3 py-2 rounded flex items-center gap-2">
            <FaPrint /> Imprimir Factura
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
