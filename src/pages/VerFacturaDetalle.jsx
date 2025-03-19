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

  // Convertir a número
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

  // ─────────────────────────────────────────────────────────────────────────────
  // ESTILOS DE TICKET (para reducir a 58mm y letra 10px, sin repintar navbar, etc.)
  // ─────────────────────────────────────────────────────────────────────────────
  // Podrías meter esto en un CSS aparte si prefieres.
  const ticketStyles = `
    @media print {
      /* Forzamos ancho de 58mm y márgenes mínimos */
      @page {
        size: 58mm auto;
        margin: 5mm;
      }
      /* Contenedor principal en impresión: fondo blanco, texto negro, fuente pequeña */
      .ticket-container {
        max-width: 58mm !important;
        background-color: #fff !important;
        color: #000 !important;
        font-size: 10px !important;
        margin: 0 auto !important;
      }
    }

    /* En pantalla, mantiene un estilo un poco más grande (si deseas) */
    .ticket-container {
      background-color: #1f2937;
      color: #fff;
      padding: 1rem;
      border-radius: 6px;
      margin: 1rem auto;
      max-width: 400px;
    }

    .ticket-header {
      text-align: center;
      margin-bottom: 0.5rem;
    }
    .ticket-header h1 {
      font-size: 1rem;
      margin: 0;
    }
    .ticket-header p {
      margin: 0;
      font-size: 0.8rem;
    }
    .ticket-box {
      border: 1px solid #444;
      padding: 6px;
      margin-bottom: 8px;
      font-size: 0.8rem;
    }
    .ticket-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
    }
    .ticket-table th,
    .ticket-table td {
      padding: 4px;
      border-bottom: 1px solid #555;
      text-align: left;
      font-size: 0.8rem;
    }
    .ticket-summary {
      margin-top: 0.5rem;
      text-align: right;
      font-size: 0.85rem;
    }
    .highlight {
      font-weight: bold;
      color: #0f0; 
    }
    .thanks {
      text-align: center;
      margin-top: 8px;
      font-size: 0.8rem;
    }
  `;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      {/* Inyectamos los estilos para el ticket */}
      <style>{ticketStyles}</style>

      {/* Contenedor principal del ticket */}
      <div className="ticket-container">
        {/* ENCABEZADO: DATOS DE LA FERRETERÍA */}
        <div className="ticket-header">
          <h1>FERRETERÍA EL CAMPESINO</h1>
          <p>Aldea Mediacuesta</p>
          <p>Tel: +502 57765449 (Pedidos)</p>
        </div>

        {/* BLOQUE DE DATOS FACTURA */}
        <div className="ticket-box">
          <p style={{ margin: 0 }}>
            <strong>Factura #{id}</strong>
          </p>
          <p style={{ margin: 0 }}>Cliente: {nombre_cliente}</p>
          <p style={{ margin: 0 }}>Creación: {fechaCreacionStr}</p>
          <p style={{ margin: 0 }}>Entrega: {fechaEntregaStr}</p>
        </div>

        {/* TABLA DE PRODUCTOS */}
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
            {detalles.map((item, idx) => {
              const precioUnit = parseFloat(item.precio_unitario) || 0;
              const subtotalItem = item.cantidad * precioUnit;
              return (
                <tr key={`detalle-${idx}`}>
                  <td>{item.producto_nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>Q{precioUnit.toFixed(2)}</td>
                  <td>Q{subtotalItem.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RESUMEN DE PRECIOS */}
        <div className="ticket-summary">
          <div>Subtotal: Q{subTotal.toFixed(2)}</div>
          <div>Costo Envío: Q{costoEnvioNum.toFixed(2)}</div>
          <div>Descuento: Q{descuentoTotalNum.toFixed(2)}</div>
          <div className="highlight">Total: Q{total.toFixed(2)}</div>
        </div>

        <div className="thanks">¡Gracias por su compra!</div>
      </div>

      {/* BOTONES (ocultos en impresión si quieres usar la clase no-print) */}
      <div className="flex gap-2 justify-center mt-4 no-print">
        <button
          onClick={() => navigate("/facturas")}
          className="bg-blue-500 px-3 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> Volver a Facturas
        </button>
        <button
          onClick={handlePrint}
          className="bg-green-500 px-3 py-2 rounded flex items-center gap-2"
        >
          <FaPrint /> Imprimir Factura
        </button>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
