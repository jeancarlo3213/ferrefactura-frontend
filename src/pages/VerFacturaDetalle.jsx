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

  const {
    nombre_cliente,
    fecha_creacion,
    fecha_entrega,
    costo_envio,
    descuento_total,
    detalles = [],
  } = factura;

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
          }
          .ticket-container {
            max-width: 58mm;
            width: 100%;
            font-size: 12px;
            color: #000;
            background: #fff;
            padding: 5px;
            margin: 0 auto;
            page-break-inside: avoid;
          }
          .ticket-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          .ticket-table th, .ticket-table td {
            padding: 2px;
            border-bottom: 1px dashed black;
          }
          .ticket-summary, .ticket-header {
            page-break-before: avoid;
            page-break-inside: avoid;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>

      <div className="max-w-lg mx-auto bg-gray-800 p-4 rounded-lg shadow-lg ticket-container">
        <div className="text-center">
          <h2 className="text-lg font-bold">FERRETERÍA EL CAMPESINO</h2>
          <p>Aldea Mediacuesta</p>
          <p>Tel: 57765449 - 34567814</p>
        </div>

        <div className="mt-2">
          <p><strong>Factura #{id}</strong></p>
          <p>Cliente: {nombre_cliente}</p>
          <p>Creación: {fechaCreacionStr}</p>
          <p>Entrega: {fechaEntregaStr}</p>
        </div>

        <table className="ticket-table w-full mt-3 border-t border-gray-400">
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

        <div className="ticket-summary mt-4">
          <p>Subtotal: Q{subTotal.toFixed(2)}</p>
          <p>Costo Envío: Q{costoEnvioNum.toFixed(2)}</p>
          <p>Descuento: Q{descuentoTotalNum.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: Q{total.toFixed(2)}</p>
        </div>

        <div className="flex justify-center gap-2 mt-4 no-print">
          <button onClick={() => navigate("/facturas")} className="btn-primary">
            <FaArrowLeft /> Volver
          </button>
          <button onClick={handlePrint} className="bg-green-500 px-3 py-2 rounded">
            <FaPrint /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;