import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import "../styles/verfactura.css";

const API_URL = import.meta.env.VITE_API_URL;

const fmtQ = (n) =>
  `Q${(Number(n) || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getUM = (precioUnitario) =>
  parseFloat(precioUnitario) > 100 ? "qq" : "un";

function VerFacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("pendiente");

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFactura();
  }, [id, token]);

  const handlePrint = () => window.print();

  const construirTextoImpresion = (f) => {
    const {
      nombre_cliente,
      fecha_creacion,
      fecha_entrega,
      costo_envio,
      descuento_total,
      detalles = [],
    } = f;
    let texto = "====== FERRETERÍA EL CAMPESINO ======\n";
    texto += "Aldea Mediacuesta\nTel: 57765449 - 34567814\n=====================================\n";
    texto += `Factura #${f.id}\nCliente: ${nombre_cliente}\nFecha Creación: ${new Date(
      fecha_creacion
    ).toLocaleString()}\nFecha Entrega: ${
      fecha_entrega || "No especificada"
    }\n\n`;

    let subTotal = 0;
    detalles.forEach((item) => {
      const precio = parseFloat(item.precio_unitario) || 0;
      const um = getUM(precio);
      subTotal += (item.cantidad || 0) * precio;
      texto += `${item.producto_nombre} (${item.cantidad || 0} ${um})\n`;
      texto += `P/U: ${fmtQ(precio)} - Subt: ${fmtQ(
        (item.cantidad || 0) * precio
      )}\n\n`;
    });

    const total =
      subTotal +
      (parseFloat(costo_envio) || 0) -
      (parseFloat(descuento_total) || 0);
    texto += `-------------------------------------\nSubtotal: ${fmtQ(
      subTotal
    )}\nCosto Envío: ${fmtQ(parseFloat(costo_envio) || 0)}\nDescuento: ${fmtQ(
      parseFloat(descuento_total) || 0
    )}\nTOTAL A PAGAR: ${fmtQ(total)}\n=====================================\n¡Gracias por su compra!\n\n`;
    return texto;
  };

  const handleRemotePrint = async () => {
    if (!factura) return;
    try {
      const response = await fetch(`${API_URL}/add_print/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ text: construirTextoImpresion(factura) }),
      });
      if (response.ok) alert("Orden de impresión enviada al backend.");
      else alert("Error al enviar la orden de impresión remota.");
    } catch (error) {
      console.error("Error al enviar la orden de impresión remota:", error);
    }
  };

  if (loading)
    return (
      <div className="vf-loader">
        <Spin tip="Cargando factura..." size="large" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 max-w-md mx-auto">
        <Alert message="Error" description={error} type="error" showIcon closable />
      </div>
    );
  if (!factura)
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

  const {
    nombre_cliente,
    fecha_creacion,
    fecha_entrega,
    costo_envio,
    descuento_total,
    detalles = [],
  } = factura;

  const subTotal = detalles.reduce(
    (acc, item) => acc + (item.cantidad || 0) * parseFloat(item.precio_unitario || 0),
    0
  );
  const total =
    subTotal +
    (parseFloat(costo_envio) || 0) -
    (parseFloat(descuento_total) || 0);

  return (
    <div className="vf-container">
      <div className="vf-card ticket-container">
        {/* Header del ticket */}
        <header className="vf-header">
          <div className="flex justify-center">
            <img src="/Logo.jpeg" alt="Logo" className="vf-logo" />
          </div>
          <h2 className="vf-title">FERRETERÍA EL CAMPESINO</h2>
          <p className="vf-sub">Aldea Mediacuesta</p>
          <p className="vf-sub">Tel: 57765449 - 34567814</p>
        </header>

        {/* Meta */}
        <section className="vf-meta">
          <span><strong>Factura #{id}</strong></span>
          <span><strong>Cliente:</strong> {nombre_cliente}</span>
          <span><strong>Creación</strong> {new Date(fecha_creacion).toLocaleString()}</span>
          <span><strong>Entrega</strong> {fecha_entrega || "No especificada"}</span>
        </section>

        {/* Estado manual */}
        <div className="vf-status">
          <label className={estado === "pendiente" ? "active" : ""}>
            <input type="checkbox" checked={estado === "pendiente"} onChange={() => setEstado("pendiente")} />
            Pendiente
          </label>
          <label className={estado === "cancelado" ? "active" : ""}>
            <input type="checkbox" checked={estado === "cancelado"} onChange={() => setEstado("cancelado")} />
            Cancelado
          </label>
        </div>

        {/* Tabla: Cant primero */}
        <div className="vf-table-wrap">
          <table className="vf-table">
            <colgroup>
              <col style={{ width: "14%" }} /> {/* Cant */}
              <col style={{ width: "10%" }} /> {/* UM */}
              <col style={{ width: "46%" }} /> {/* Producto */}
              <col style={{ width: "15%" }} /> {/* P/U */}
              <col style={{ width: "15%" }} /> {/* Subt */}
            </colgroup>

            <thead>
              <tr>
                <th className="sticky right">Cant</th>
                <th className="sticky center">UM</th>
                <th className="sticky">Producto</th>
                <th className="sticky right">P/U</th>
                <th className="sticky right">Subt</th>
              </tr>
            </thead>

            <tbody>
              {detalles.map((item, idx) => {
                const pu = parseFloat(item.precio_unitario) || 0;
                const um = getUM(pu);
                const filaSub = (item.cantidad || 0) * pu;
                return (
                  <tr className="vf-row" key={idx}>
                    <td className="vf-num">{item.cantidad ?? 0}</td>
                    <td className="vf-um">{um}</td>
                    <td className="vf-prod" title={item.producto_nombre}>{item.producto_nombre}</td>
                    <td className="vf-num">{fmtQ(pu)}</td>
                    <td className="vf-num">{fmtQ(filaSub)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="vf-summary">
          <p>Subtotal: {fmtQ(subTotal)}</p>
          <p>Costo Envío: {fmtQ(parseFloat(costo_envio) || 0)}</p>
          <p>Descuento: {fmtQ(parseFloat(descuento_total) || 0)}</p>
          <p className="vf-total">Total: {fmtQ(total)}</p>
        </div>

        {/* Acciones (no se imprimen) */}
        <div className="vf-actions no-print">
          <button onClick={() => navigate("/facturas")} className="vf-btn vf-btn-dark">
            <FaArrowLeft /> Volver
          </button>
          <button onClick={handlePrint} className="vf-btn vf-btn-green">
            <FaPrint /> Imprimir Local
          </button>
          <button onClick={handleRemotePrint} className="vf-btn vf-btn-blue">
            <FaPrint /> Imprimir Remota
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
