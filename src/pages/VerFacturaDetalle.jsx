import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import "../styles/verfactura.css";

const API_URL = import.meta.env.VITE_API_URL;

function VerFacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("pendiente");

  const token = localStorage.getItem("token");

  // Carga de datos
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/facturas/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!res.ok) throw new Error("No se pudo obtener la factura.");
        const data = await res.json();
        setFactura(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token, API_URL]);

  const handlePrint = () => window.print();

  // Helpers
  const toQ = (n) => `Q${(Number(n) || 0).toFixed(2)}`;

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
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
        />
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="vf-loader">
        <Alert
          message="Factura no encontrada"
          description={`No se encontró la factura con ID ${id}.`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles = [] } = factura;

  const filas = detalles.map((d) => {
    const cant = Number(d.cantidad) || 0;
    const pu = Number(d.precio_unitario) || 0;
    const subt = cant * pu;
    // UM heurística (si no viene del backend): U si es precio unitario bajo; qq si es alto
    const um = pu >= 100 ? "qq" : "U";
    return {
      cant,
      um,
      nombre: d.producto_nombre || "",
      pu,
      subt,
    };
  });

  const subtotal = filas.reduce((acc, f) => acc + f.subt, 0);
  const total =
    subtotal + (Number(costo_envio) || 0) - (Number(descuento_total) || 0);

  return (
    <div className="vf-container">
      {/* ====== Vista de pantalla (bonita) ====== */}
      <div className="vf-card-screen">
        <header className="vf-header">
          <img src="/Logo.jpeg" alt="Logo" className="vf-logo" />
          <h1 className="vf-title">FERRETERÍA EL CAMPESINO</h1>
          <p className="vf-sub">Aldea Mediacuesta — Tel: 57765449 / 34567814</p>
        </header>

        <section className="vf-meta">
          <span><strong>Factura:</strong> #{id}</span>
          <span><strong>Cliente:</strong> {nombre_cliente}</span>
          <span>
            <strong>Creación:</strong>{" "}
            {new Date(fecha_creacion).toLocaleString()}
          </span>
          <span>
            <strong>Entrega:</strong>{" "}
            {fecha_entrega || "No especificada"}
          </span>
        </section>

        <div className="vf-status">
          <label
            className={`chip ${estado === "pendiente" ? "active" : ""}`}
            onClick={() => setEstado("pendiente")}
          >
            Pendiente
          </label>
          <label
            className={`chip ${estado === "cancelado" ? "active" : ""}`}
            onClick={() => setEstado("cancelado")}
          >
            Cancelado
          </label>
        </div>

        <div className="vf-table-wrap">
          <table className="vf-table">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "48%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="sticky">Cant</th>
                <th className="sticky">UM</th>
                <th className="sticky">Producto</th>
                <th className="sticky">P/U</th>
                <th className="sticky">Subt</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} className="vf-row">
                  <td className="vf-num">{f.cant}</td>
                  <td className="vf-um">{f.um}</td>
                  <td className="vf-prod">{f.nombre}</td>
                  <td className="vf-num">{toQ(f.pu)}</td>
                  <td className="vf-num">{toQ(f.subt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="vf-summary">
          <p>
            <strong>Subtotal: </strong>
            {toQ(subtotal)}
          </p>
          <p>
            <strong>Costo Envío (Q): </strong>
            {toQ(costo_envio)}
          </p>
          <p>
            <strong>Descuento: </strong>
            {toQ(descuento_total)}
          </p>
          <p className="vf-total">
            <strong>Total: </strong>
            {toQ(total)}
          </p>
        </section>

        <p className="vf-verse">
          “Pon en manos del Señor todas tus obras.” — Proverbios 16:3
        </p>

        <div className="vf-actions">
          <button className="vf-btn vf-btn-dark" onClick={() => navigate("/facturas")}>
            <FaArrowLeft /> Volver
          </button>
          <button className="vf-btn vf-btn-green" onClick={handlePrint}>
            <FaPrint /> Imprimir
          </button>
        </div>
      </div>

      {/* ====== Ticket para impresión térmica (80mm) ======
           NOTA: en pantalla está oculto; en @media print se muestra y se imprime solo esta parte. */}
      <div id="ticket">
        <div className="tk-box">
          <div className="tk-header">
            <img src="/Logo.jpeg" alt="Logo" className="tk-logo" />
            <div className="tk-store">FERRETERÍA EL CAMPESINO</div>
            <div className="tk-sub">Aldea Mediacuesta – Tel: 57765449 / 34567814</div>
          </div>

          <div className="tk-meta">
            <div><b>Factura:</b> #{id}</div>
            <div><b>Cliente:</b> {nombre_cliente}</div>
            <div><b>Creación:</b> {new Date(fecha_creacion).toLocaleString()}</div>
            <div><b>Entrega:</b> {fecha_entrega || "No especificada"}</div>
          </div>

          <table className="tk-table">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "46%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Can</th>
                <th>UM</th>
                <th>Producto</th>
                <th>P/U</th>
                <th>Subt</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="num">{f.cant}</td>
                  <td className="um">{f.um}</td>
                  <td className="prod">{f.nombre}</td>
                  <td className="num">{toQ(f.pu)}</td>
                  <td className="num">{toQ(f.subt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="tk-sep" />

          <div className="tk-totals">
            <div><span>Subtotal:</span><b>{toQ(subtotal)}</b></div>
            <div><span>Costo Envío (Q):</span><b>{toQ(costo_envio)}</b></div>
            <div><span>Descuento:</span><b>{toQ(descuento_total)}</b></div>
            <div className="tk-total"><span>Total:</span><b>{toQ(total)}</b></div>
          </div>

          <div className="tk-verse">
            “Pon en manos del Señor todas tus obras.” — Proverbios 16:3
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
