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
  
  // 🔹 Token para autenticación (si tu backend lo requiere)
  const token = localStorage.getItem("token");

  // ------------------------
  // 1) Cargar factura actual
  // ------------------------
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

  // ------------------------
  // 2) Función para imprimir localmente
  // ------------------------
  const handlePrint = () => {
    window.print();
  };

  // ------------------------
  // 3) Enviar orden de impresión al backend (Remota)
  // ------------------------
  const handleRemotePrint = async () => {
    if (!factura) return;
    try {
      const response = await fetch(`${API_URL}/add_print/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          // Añade más campos si quieres evitar duplicados en el backend
          text: construirTextoImpresion(factura),
        }),
      });

      if (response.ok) {
        alert("Orden de impresión enviada al backend (remoto).");
      } else {
        alert("Error al enviar la orden de impresión remota.");
      }
    } catch (error) {
      console.error("Error al enviar la orden de impresión remota:", error);
    }
  };

  // ------------------------
  // 4) Auto-detección de órdenes pendientes
  //    para imprimir sin instalar nada en la PC.
  // ------------------------
  // - Se ejecuta cada 30 segundos.
  useEffect(() => {
    const checkPrintJobs = async () => {
      try {
        const resp = await fetch(`${API_URL}/get_jobs/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await resp.json();
        const jobs = data.jobs || [];

        // Para cada orden pendiente, la imprimimos y marcamos como impresa
        for (const job of jobs) {
          printRemoteText(job.text);
          await markJobAsPrinted(job.id);
        }
      } catch (err) {
        console.error("Error al obtener trabajos de impresión remota:", err);
      }
    };

    // Llamamos la primera vez
    checkPrintJobs();

    // Revisamos cada 30s
    const intervalId = setInterval(checkPrintJobs, 30000);
    return () => clearInterval(intervalId);
  }, [token]);

  // Imprime texto en una ventana emergente
  const printRemoteText = (text) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <pre style="font-family: monospace; font-size: 14px;">
${text}
      </pre>
      <script>
        window.print();
        window.close();
      </script>
    `);
    printWindow.document.close();
  };

  // Marca la orden como impresa en el backend
  const markJobAsPrinted = async (jobId) => {
    try {
      await fetch(`${API_URL}/mark_printed/${jobId}/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });
    } catch (err) {
      console.error("Error al marcar la orden como impresa:", err);
    }
  };

  // ------------------------
  // 5) Construir el texto de impresión (remota)
  // ------------------------
  const construirTextoImpresion = (factura) => {
    const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles = [] } = factura;

    let texto = "====== FERRETERÍA EL CAMPESINO ======\n";
    texto += "Aldea Mediacuesta\n";
    texto += "Tel: 57765449 - 34567814\n";
    texto += "=====================================\n";
    texto += `Factura #${factura.id}\n`;
    texto += `Cliente: ${nombre_cliente}\n`;
    texto += `Fecha Creación: ${new Date(fecha_creacion).toLocaleString()}\n`;
    texto += `Fecha Entrega: ${fecha_entrega || "No especificada"}\n\n`;

    let subTotal = 0;
    detalles.forEach((item) => {
      const precio = parseFloat(item.precio_unitario) || 0;
      subTotal += item.cantidad * precio;
      texto += `Producto: ${item.producto_nombre}\n`;
      texto += `Cant: ${item.cantidad}  P/U: Q${precio.toFixed(2)}\n`;
      texto += `Subtotal: Q${(item.cantidad * precio).toFixed(2)}\n\n`;
    });

    const costoEnvioNum = parseFloat(costo_envio) || 0;
    const descuentoTotalNum = parseFloat(descuento_total) || 0;
    const total = subTotal + costoEnvioNum - descuentoTotalNum;

    texto += `-------------------------------------\n`;
    texto += `Subtotal: Q${subTotal.toFixed(2)}\n`;
    texto += `Costo Envío: Q${costoEnvioNum.toFixed(2)}\n`;
    texto += `Descuento: Q${descuentoTotalNum.toFixed(2)}\n`;
    texto += `TOTAL A PAGAR: Q${total.toFixed(2)}\n`;
    texto += `=====================================\n`;
    texto += "¡Gracias por su compra!\n\n";

    return texto;
  };

  // ------------------------
  // 6) Render principal
  // ------------------------
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

  // Desestructurar datos para el render local
  const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles = [] } = factura;
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

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      {/* Estilos de impresión local */}
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
        {/* Encabezado */}
        <div className="text-center">
          <h2 className="text-lg font-bold">FERRETERÍA EL CAMPESINO</h2>
          <p>Aldea Mediacuesta</p>
          <p>Tel: 57765449 - 34567814</p>
        </div>

        {/* Datos de la factura */}
        <div className="mt-2">
          <p><strong>Factura #{id}</strong></p>
          <p>Cliente: {nombre_cliente}</p>
          <p>Creación: {fechaCreacionStr}</p>
          <p>Entrega: {fechaEntregaStr}</p>
        </div>

        {/* Detalles de productos */}
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

        {/* Resumen */}
        <div className="ticket-summary mt-4">
          <p>Subtotal: Q{subTotal.toFixed(2)}</p>
          <p>Costo Envío: Q{costoEnvioNum.toFixed(2)}</p>
          <p>Descuento: Q{descuentoTotalNum.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: Q{total.toFixed(2)}</p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-2 mt-4 no-print">
          <button onClick={() => navigate("/facturas")} className="btn-primary">
            <FaArrowLeft /> Volver
          </button>

          {/* Botón de impresión local */}
          <button onClick={handlePrint} className="bg-green-500 px-3 py-2 rounded">
            <FaPrint /> Imprimir Local
          </button>

          {/* Botón de impresión remota */}
          <button onClick={handleRemotePrint} className="bg-blue-500 px-3 py-2 rounded">
            <FaPrint /> Imprimir Remota
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
