import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import "../styles/verfactura.css";

const API_URL = import.meta.env.VITE_API_URL;

// helper: Q 2 decimales
const q = (n) => `Q${Number(n || 0).toFixed(2)}`;

function VerFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const res = await fetch(`${API_URL}/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!res.ok) throw new Error("No se pudo obtener la factura.");
        const data = await res.json();
        setFactura(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFactura();
  }, [id, token]);

  if (loading) {
    return (
      <div className="vf-loader">
        <Spin tip="Cargando factura..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="vf-loader">
        <Alert type="error" message="Error" description={error} showIcon />
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="vf-loader">
        <Alert
          type="warning"
          showIcon
          message="Factura no encontrada"
          description={`No se encontró la factura #${id}.`}
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

  const subtotal = detalles.reduce(
    (acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario),
    0
  );
  const total = subtotal + Number(costo_envio || 0) - Number(descuento_total || 0);

  const VERSE =
    "Pon en manos del SEÑOR todas tus obras y tus proyectos se cumplirán. — Proverbios 16:3";

  const handlePrint = () => window.print();

  return (
    <div className="vf-container">
      {/* Tarjeta en pantalla y también base del ticket */}
      <div className="vf-card ticket-container" id="ticket">
        {/* Encabezado con logo y datos */}
        <header className="vf-header">
          <img src="/Logo.jpeg" alt="Logo" className="vf-logo" />
          <h1 className="vf-title">FERRETERÍA EL CAMPESINO</h1>
          <p className="vf-sub">Aldea Mediacuesta – Tel: 57765449 / 34567814</p>
        </header>

        {/* Meta */}
        <section className="vf-meta">
          <span><strong>Factura:</strong> #{id}</span>
          <span><strong>Cliente:</strong> {nombre_cliente}</span>
          <span><strong>Creación:</strong> {new Date(fecha_creacion).toLocaleString()}</span>
          <span><strong>Entrega:</strong> {fecha_entrega || "No especificada"}</span>
        </section>

        {/* Tabla */}
        <div className="vf-table-wrap">
          <table className="vf-table" aria-label="Detalle de productos">
            <colgroup>
              <col className="col-cant" />
              <col className="col-desc" />
              <col className="col-unit" />
              <col className="col-subt" />
            </colgroup>
            <thead>
              <tr>
                <th className="sticky">Cant</th>
                <th className="sticky">Descripción</th>
                <th className="sticky">P/U</th>
                <th className="sticky">Subt</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length === 0 ? (
                <tr className="vf-row">
                  <td colSpan={4} style={{ textAlign: "center", padding: "12px" }}>
                    Sin productos
                  </td>
                </tr>
              ) : (
                detalles.map((d, idx) => (
                  <tr className="vf-row" key={idx}>
                    <td className="vf-num">{d.cantidad}</td>
                    <td className="vf-desc">{d.producto_nombre}</td>
                    <td className="vf-num">{q(d.precio_unitario)}</td>
                    <td className="vf-num">{q(Number(d.cantidad) * Number(d.precio_unitario))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <section className="vf-summary">
          <p><span>Subtotal:</span> <strong>{q(subtotal)}</strong></p>
          <p><span>Costo Envío (Q):</span> <strong>{q(costo_envio)}</strong></p>
          <p><span>Descuento:</span> <strong>{q(descuento_total)}</strong></p>
          <p className="vf-total"><span>Total:</span> <strong>{q(total)}</strong></p>
        </section>

        {/* Frase */}
        <p className="vf-verse">{VERSE}</p>
      </div>

      {/* Barra de acciones (pantalla) */}
      <div className="vf-actions no-print">
        <button className="vf-btn vf-btn-dark" onClick={() => navigate("/facturas")}>
          <FaArrowLeft /> Volver
        </button>
        <button className="vf-btn vf-btn-green" onClick={handlePrint}>
          <FaPrint /> Imprimir
        </button>
      </div>
    </div>
  );
}

export default VerFactura;
