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
      response.ok
        ? alert("Orden de impresión enviada al backend.")
        : alert("Error al enviar la orden de impresión remota.");
    } catch (error) {
      console.error("Error al enviar la orden de impresión remota:", error);
    }
  };

  const construirTextoImpresion = (factura) => {
    const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles = [] } = factura;
    let texto = "====== FERRETERÍA EL CAMPESINO ======\n";
    texto += "Aldea Mediacuesta\nTel: 57765449 - 34567814\n=====================================\n";
    texto += `Factura #${factura.id}\nCliente: ${nombre_cliente}\nFecha Creación: ${new Date(fecha_creacion).toLocaleString()}\nFecha Entrega: ${fecha_entrega || "No especificada"}\n\n`;

    let subTotal = 0;
    detalles.forEach((item) => {
      const precio = parseFloat(item.precio_unitario) || 0;
      const unidad = precio > 100 ? "quintal" : "unidad";
      subTotal += item.cantidad * precio;
      texto += `${item.producto_nombre} (${item.cantidad} ${unidad})\n`;
      texto += `P/U: Q${precio.toFixed(2)} - Subt: Q${(item.cantidad * precio).toFixed(2)}\n\n`;
    });

    const total = subTotal + (parseFloat(costo_envio) || 0) - (parseFloat(descuento_total) || 0);
    texto += `-------------------------------------\nSubtotal: Q${subTotal.toFixed(2)}\nCosto Envío: Q${(parseFloat(costo_envio) || 0).toFixed(2)}\nDescuento: Q${(parseFloat(descuento_total) || 0).toFixed(2)}\nTOTAL A PAGAR: Q${total.toFixed(2)}\n=====================================\n¡Gracias por su compra!\n\n`;
    return texto;
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-900"><Spin tip="Cargando factura..." size="large" /></div>;
  if (error) return <div className="p-4 max-w-md mx-auto"><Alert message="Error" description={error} type="error" showIcon closable /></div>;
  if (!factura) return <div className="p-4 max-w-md mx-auto"><Alert message="Factura no encontrada" description={`No se encontró la factura con ID ${id}.`} type="warning" showIcon /></div>;

  const { nombre_cliente, fecha_creacion, fecha_entrega, costo_envio, descuento_total, detalles = [] } = factura;
  const subTotal = detalles.reduce((acc, item) => acc + item.cantidad * parseFloat(item.precio_unitario), 0);
  const total = subTotal + (parseFloat(costo_envio) || 0) - (parseFloat(descuento_total) || 0);

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 0; }
          body { background: #fff; color: #000; margin: 0; padding: 0; }
          .ticket-container { max-width: 58mm; width: 100%; font-size: 12px; background: #fff; color: #000; padding: 5px; margin: 0 auto; }
          .no-print { display: none; }
          .ticket-table { width: 100%; border-collapse: collapse; text-align: left; }
          .ticket-table th, .ticket-table td { padding: 2px; border-bottom: 1px dashed black; }
        }
      `}</style>

      <div className="max-w-lg mx-auto bg-gray-800 p-4 rounded-lg shadow-lg ticket-container">
        <div className="text-center mb-3">
          <div className="flex justify-center">
            <img src="/Logo.jpeg" alt="Logo" className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-md" />
          </div>
          <h2 className="text-lg font-bold mt-2">FERRETERÍA EL CAMPESINO</h2>
          <p>Aldea Mediacuesta</p>
          <p>Tel: 57765449 - 34567814</p>
        </div>

        <div className="mb-3 text-sm">
          <p><strong>Factura #{id}</strong></p>
          <p>Cliente: {nombre_cliente}</p>
          <p>Creación: {new Date(fecha_creacion).toLocaleString()}</p>
          <p>Entrega: {fecha_entrega || "No especificada"}</p>
        </div>

        {/* Estado Manual */}
        <div className="flex justify-center gap-6 mb-4 border border-gray-600 rounded p-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={estado === "pendiente"} onChange={() => setEstado("pendiente")} />
            Pendiente
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={estado === "cancelado"} onChange={() => setEstado("cancelado")} />
            Cancelado
          </label>
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
            {detalles.map((item, idx) => {
              const precio = parseFloat(item.precio_unitario);
              const unidad = precio > 100 ? "quintal" : "unidad";
              return (
                <tr key={idx}>
                  <td>{item.producto_nombre}</td>
                  <td>{item.cantidad} {unidad}</td>
                  <td>Q{precio.toFixed(2)}</td>
                  <td>Q{(item.cantidad * precio).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 text-sm">
          <p>Subtotal: Q{subTotal.toFixed(2)}</p>
          <p>Costo Envío: Q{(parseFloat(costo_envio) || 0).toFixed(2)}</p>
          <p>Descuento: Q{(parseFloat(descuento_total) || 0).toFixed(2)}</p>
          <p className="font-bold text-lg">Total: Q{total.toFixed(2)}</p>
        </div>

        <div className="flex justify-center gap-2 mt-4 no-print">
          <button onClick={() => navigate("/facturas")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaArrowLeft /> Volver
          </button>
          <button onClick={handlePrint} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaPrint /> Imprimir Local
          </button>
          <button onClick={handleRemotePrint} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <FaPrint /> Imprimir Remota
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerFacturaDetalle;
