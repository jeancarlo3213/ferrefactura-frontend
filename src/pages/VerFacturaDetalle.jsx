import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import "../styles/verfactura.css";

const API_URL = import.meta.env.VITE_API_URL;

// Q con 2 decimales
const q = (n) => `Q${Number(n || 0).toFixed(2)}`;

function VerFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!res.ok) throw new Error("No se pudo obtener la factura.");
        const data = await res.json();
        if (alive) setFactura(data);
      } catch (e) {
        if (alive) setError(e.message || "Error desconocido");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token]);

  // ⚠️ Todos los hooks arriba, sin condiciones
  const detalles = useMemo(() => (factura?.detalles ?? []), [factura]);
  const subtotal = useMemo(
    () => detalles.reduce(
      (acc, d) => acc + Number(d.cantidad) * Number(d.precio_unitario),
      0
    ),
    [detalles]
  );
  const total = useMemo(
    () => subtotal + Number(factura?.costo_envio || 0) - Number(factura?.descuento_total || 0),
    [subtotal, factura?.costo_envio, factura?.descuento_total]
  );

  const handlePrint = () => window.print();

  // Ahora sí, retornos condicionales
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

  // Datos seguros
  const nombre_cliente = factura.nombre_cliente || "Consumidor final";
  const fechaCreacionTxt = new Date(factura.fecha_creacion)
    .toLocaleString("es-GT", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    })
    .replace(",", ""); // evita salto raro de 'a. m.'
  const fechaEntregaTxt = factura.fecha_entrega
    ? new Date(factura.fecha_entrega).toLocaleDateString("es-GT", {
        year: "numeric", month: "2-digit", day: "2-digit",
      })
    : "No especificada";

  const VERSE =
    "Pon en manos del SEÑOR todas tus obras y tus proyectos se cumplirán. — Proverbios 16:3";

  return (
    <div className="vf-container">
      {/* Tarjeta (pantalla) y base del ticket (impresión) */}
      <div className="vf-card ticket-container" id="ticket" role="region" aria-label="Factura">
        {/* Encabezado */}
        <header className="vf-header">
          <img src="/Logo.jpeg" alt="Logo" className="vf-logo" />
          <h1 className="vf-title">FERRETERÍA EL CAMPESINO</h1>
          <p className="vf-sub">Aldea Mediacuesta – Tel: 57765449 / 34567814</p>
        </header>

        {/* Meta */}
        <section className="vf-meta" aria-label="Datos de factura">
          <span><strong>Factura:</strong> #{id}</span>
          <span><strong>Cliente:</strong> {nombre_cliente}</span>
          <span><strong>Creación:</strong> {fechaCreacionTxt}</span>
          <span><strong>Entrega:</strong> {fechaEntregaTxt}</span>
        </section>

        {/* Detalle */}
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
                <th className="col-cant">Cant</th>
                <th className="col-desc">Descripción</th>
                <th className="col-unit">P/U</th>
                <th className="col-subt">Subt</th>
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
                detalles.map((d, idx) => {
                  const cant = Number(d.cantidad);
                  const pu = Number(d.precio_unitario);
                  const subt = cant * pu;
                  return (
                    <tr className="vf-row" key={`${idx}-${d.producto_id || d.producto_nombre}`}>
                      <td className="vf-num">{cant}</td>
                      <td className="vf-desc">{d.producto_nombre}</td>
                      <td className="vf-num">{q(pu)}</td>
                      <td className="vf-num">{q(subt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <section className="vf-summary" aria-label="Resumen">
          <p>Subtotal: <strong>{q(subtotal)}</strong></p>
          <p>Costo Envío: <strong>{q(factura.costo_envio)}</strong></p>
          <p>Descuento: <strong>{q(factura.descuento_total)}</strong></p>
          <p className="vf-total">TOTAL: {q(total)}</p>
        </section>

        {/* Frase */}
        <p className="vf-verse">{VERSE}</p>
      </div>

      {/* Acciones (pantalla) */}
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
