import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, Heading, VStack, Text,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useDisclosure
} from "@chakra-ui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// IMPORTANTE: Asegurate de tener esto instalado: npm i chart.js
import Chart from "chart.js/auto";

const API_URL = import.meta.env.VITE_API_URL;

function Reportes() {
  const [productos, setProductos] = useState([]);
  const [facturasDetalle, setFacturasDetalle] = useState([]);
  const [logoBase64, setLogoBase64] = useState(null);

  // Rangos de fecha para filtrar
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Previsualizar PDF
  const [previewUrl, setPreviewUrl] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Referencia para Canvas de gráficas
  const chartRef = useRef(null);

  useEffect(() => {
    obtenerDatos();
    cargarLogo();
  }, []);

  // Cargar el logo para usarlo en el PDF
  const cargarLogo = async () => {
    try {
      const response = await fetch("/Logo.jpeg");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result);
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("No se encontró Logo.jpeg");
    }
  };

  // Consumimos la API para productos y facturasDetalle
  const obtenerDatos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const [resProd, resFact] = await Promise.all([
        fetch(`${API_URL}/productos/`, { headers }),
        fetch(`${API_URL}/facturas-detalle/`, { headers }),
      ]);

      const productosData = await resProd.json();
      const facturasData = await resFact.json();

      // Ajustamos si hace falta el campo 'fecha' en facturasDetalle
      const facturasConFecha = facturasData.map(f => ({
        ...f,
        // Ej: si tu backend retorna factura.fecha_creacion
        // Ajusta si tu backend lo maneja distinto
        fecha: f.factura?.fecha_creacion || null,
        // Campos de compra
        producto_precio_compra_unidad: f.producto?.precio_compra_unidad || 0,
        producto_precio_compra_quintal: f.producto?.precio_compra_quintal || 0
      }));

      setProductos(productosData);
      setFacturasDetalle(facturasConFecha);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  // Filtrar por fecha
  const filtrarPorFecha = (arreglo) => {
    return arreglo.filter(item => {
      if (!item.fecha) return false;
      const fechaItem = new Date(item.fecha);
      const inicio = startDate ? new Date(startDate) : null;
      const fin = endDate ? new Date(endDate) : null;
      if (inicio && fin) return fechaItem >= inicio && fechaItem <= fin;
      if (inicio) return fechaItem >= inicio;
      if (fin) return fechaItem <= fin;
      return true; // si no hay fecha de inicio ni fin, no filtra nada
    });
  };

  // Función auxiliar para mostrar la vista previa
  const mostrarPreview = (doc) => {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    onOpen();
  };

  // Agregar logo y título a cada PDF
  const agregarEncabezado = (doc, titulo) => {
    const fecha = new Date().toLocaleString("es-GT");
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 10, 10, 25, 25);
    }
    doc.setFontSize(14);
    doc.text(titulo, 45, 18);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${fecha}`, 45, 24);
  };

  // Función general para reportes con solo tablas
  const generarReporteSimple = (titulo, headers, rows) => {
    const doc = new jsPDF();
    agregarEncabezado(doc, titulo);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35
    });
    mostrarPreview(doc);
  };

  // ================ 1. Top 15 Más Vendidos (General) ================
  const top15MasVendidos = () => {
    const contador = {};
    facturasDetalle.forEach(f => {
      if (!f.producto_nombre) return;
      if (!contador[f.producto_nombre]) contador[f.producto_nombre] = 0;
      contador[f.producto_nombre] += f.cantidad;
    });
    // Ordenamos y top 15
    const sorted = Object.entries(contador).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const rows = sorted.map(([nombre, cant]) => [nombre, cant]);

    generarReporteSimple("Top 15 Más Vendidos (General)", ["Producto", "Cantidad"], rows);
  };

  // ================ 2. Más Vendidos por cada Mes (todo el historial) ================
  const masVendidosPorMes = () => {
    // Agrupamos por: mes -> producto -> cantidad
    const resumen = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha || !f.producto_nombre) return;
      const fechaObj = new Date(f.fecha);
      const mesKey = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, "0")}`;
      if (!resumen[mesKey]) resumen[mesKey] = {};
      if (!resumen[mesKey][f.producto_nombre]) resumen[mesKey][f.producto_nombre] = 0;
      resumen[mesKey][f.producto_nombre] += f.cantidad;
    });

    // Convertimos a filas
    const rows = [];
    Object.entries(resumen).forEach(([mes, productos]) => {
      // ordenamos los productos de cada mes y sacamos top 5
      const sorted = Object.entries(productos).sort((a, b) => b[1] - a[1]).slice(0, 5);
      sorted.forEach(([prod, cant]) => {
        rows.push([mes, prod, cant]);
      });
    });
    generarReporteSimple("Más Vendidos por Mes (Top 5 c/mes)", ["Mes", "Producto", "Cantidad"], rows);
  };

  // ================ 3. Más Vendidos por Año (Top 5 c/año) ================
  const masVendidosPorAnio = () => {
    const resumen = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha || !f.producto_nombre) return;
      const year = new Date(f.fecha).getFullYear();
      if (!resumen[year]) resumen[year] = {};
      if (!resumen[year][f.producto_nombre]) resumen[year][f.producto_nombre] = 0;
      resumen[year][f.producto_nombre] += f.cantidad;
    });
    const rows = [];
    Object.entries(resumen).forEach(([anio, productos]) => {
      const sorted = Object.entries(productos).sort((a, b) => b[1] - a[1]).slice(0, 5);
      sorted.forEach(([prod, cant]) => {
        rows.push([anio, prod, cant]);
      });
    });
    generarReporteSimple("Más Vendidos por Año (Top 5 c/año)", ["Año", "Producto", "Cantidad"], rows);
  };

  // ================ 4. Inversión Total (precio_compra * stock) ================
  const inversionTotal = () => {
    // Suponemos que si p.unidades_por_quintal > 0, la compra se reparte
    // calculado: (precio_compra_quintal * quintales) + (precio_compra_unidad * sobrantes)
    const rows = productos.map((p) => {
      const compraUnidad = p.precio_compra_unidad || 0;
      const compraQuintal = p.precio_compra_quintal || 0;
      const uPorQ = p.unidades_por_quintal || 1;
      const quintales = Math.floor(p.stock / uPorQ);
      const sobrantes = p.stock % uPorQ;

      const inversion = quintales * compraQuintal + sobrantes * compraUnidad;
      return [
        p.nombre,
        p.stock,
        `Q${inversion.toFixed(2)}`
      ];
    });
    generarReporteSimple("Inversión Total (Por producto)", ["Producto", "Stock", "Inversión"], rows);
  };

  // ================ 5. Inversión por Categoría ================
  const inversionPorCategoria = () => {
    const categorias = {};
    productos.forEach((p) => {
      const cat = p.categoria || "Sin categoría";
      if (!categorias[cat]) categorias[cat] = 0;
      // Mismo cálculo de la 4
      const compraUnidad = p.precio_compra_unidad || 0;
      const compraQuintal = p.precio_compra_quintal || 0;
      const uPorQ = p.unidades_por_quintal || 1;
      const quintales = Math.floor(p.stock / uPorQ);
      const sobrantes = p.stock % uPorQ;
      const inversion = quintales * compraQuintal + sobrantes * compraUnidad;
      categorias[cat] += inversion;
    });
    const rows = Object.entries(categorias).map(([cat, inv]) => [cat, `Q${inv.toFixed(2)}`]);
    generarReporteSimple("Inversión por Categoría", ["Categoría", "Inversión Total"], rows);
  };

  // ================ 6. Reporte de Stock Bajo (<= 5) ================
  const reporteStockBajo = () => {
    const rows = productos
      .filter(p => p.stock <= 5)
      .map(p => [p.nombre, p.stock]);
    generarReporteSimple("Productos con Stock Bajo (<=5)", ["Producto", "Stock"], rows);
  };

  // ================ 7. Reporte de Stock Alto (top 20) ================
  const reporteStockAlto = () => {
    const sorted = [...productos].sort((a, b) => b.stock - a.stock).slice(0, 20);
    const rows = sorted.map(p => [p.nombre, p.stock]);
    generarReporteSimple("Top 20 Productos con Mayor Stock", ["Producto", "Stock"], rows);
  };

  // Funciones auxiliares para sumar ventas
  const totalVenta = (item) => {
    return item.cantidad * parseFloat(item.precio_unitario);
  };
  const totalGanancia = (item) => {
    // Basado en facturasDetalle: (precio_venta - precio_compra) * cantidad
    const compra = item.tipo_venta === "Unidad"
      ? item.producto_precio_compra_unidad
      : item.producto_precio_compra_quintal;
    return (parseFloat(item.precio_unitario) - parseFloat(compra)) * item.cantidad;
  };

  // ================ 8. Ventas totales por día (en rango) ================
  const ventasPorDiaRango = () => {
    const filtrados = filtrarPorFecha(facturasDetalle);
    const agrupar = {};
    filtrados.forEach(f => {
      if (!f.fecha) return;
      const dia = f.fecha.split("T")[0];
      if (!agrupar[dia]) agrupar[dia] = 0;
      agrupar[dia] += totalVenta(f);
    });
    const rows = Object.entries(agrupar).map(([dia, val]) => [dia, `Q${val.toFixed(2)}`]);
    generarReporteSimple("Ventas por Día (Rango)", ["Fecha", "Total Ventas"], rows);
  };

  // ================ 9. Ventas por Mes (todo historial) ================
  const ventasPorMes = () => {
    const agrupar = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha) return;
      const d = new Date(f.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!agrupar[key]) agrupar[key] = 0;
      agrupar[key] += totalVenta(f);
    });
    const rows = Object.entries(agrupar).map(([mes, val]) => [mes, `Q${val.toFixed(2)}`]);
    generarReporteSimple("Ventas por Mes", ["Mes", "Total Ventas"], rows);
  };

  // ================ 10. Ventas por Año ================
  const ventasPorAnio = () => {
    const agrupar = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha) return;
      const year = new Date(f.fecha).getFullYear();
      if (!agrupar[year]) agrupar[year] = 0;
      agrupar[year] += totalVenta(f);
    });
    const rows = Object.entries(agrupar).map(([yr, val]) => [yr, `Q${val.toFixed(2)}`]);
    generarReporteSimple("Ventas por Año", ["Año", "Total Ventas"], rows);
  };

  // ================ 11. Ganancia (ventas - compra) por mes ================
  const gananciaPorMes = () => {
    const agrupar = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha) return;
      const d = new Date(f.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!agrupar[key]) agrupar[key] = 0;
      agrupar[key] += totalGanancia(f);
    });
    const rows = Object.entries(agrupar).map(([mes, val]) => [mes, `Q${val.toFixed(2)}`]);
    generarReporteSimple("Ganancia por Mes", ["Mes", "Ganancia"], rows);
  };

  // ================ 12. Ganancia por Año ================
  const gananciaPorAnio = () => {
    const agrupar = {};
    facturasDetalle.forEach(f => {
      if (!f.fecha) return;
      const year = new Date(f.fecha).getFullYear();
      if (!agrupar[year]) agrupar[year] = 0;
      agrupar[year] += totalGanancia(f);
    });
    const rows = Object.entries(agrupar).map(([yr, val]) => [yr, `Q${val.toFixed(2)}`]);
    generarReporteSimple("Ganancia por Año", ["Año", "Ganancia"], rows);
  };

  // ================ 13. Productos Más Vendidos (Gráfico de Barras) ================
  const productosMasVendidosGrafica = async () => {
    // Prepara datos
    const contador = {};
    facturasDetalle.forEach(f => {
      if (!f.producto_nombre) return;
      if (!contador[f.producto_nombre]) contador[f.producto_nombre] = 0;
      contador[f.producto_nombre] += f.cantidad;
    });
    // top 10
    const sorted = Object.entries(contador).sort((a, b) => b[1] - a[1]).slice(0, 10);
    // Creamos canvas en memoria
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map(([prod]) => prod),
        datasets: [{
          label: "Cantidad Vendida",
          data: sorted.map(([, cant]) => cant),
          backgroundColor: "blue"
        }]
      },
      options: {
        responsive: false,
        animation: false
      }
    });

    // Esperamos un poquito
    await new Promise(r => setTimeout(r, 500));
    // Convertimos canvas a imagen
    const imgData = canvas.toDataURL("image/png");

    // Armamos PDF
    const doc = new jsPDF();
    agregarEncabezado(doc, "Top 10 Más Vendidos (Gráfico)");
    doc.addImage(imgData, "PNG", 15, 35, 180, 80);

    // Listado tabular también
    const rows = sorted.map(([prod, cant]) => [prod, cant]);
    autoTable(doc, {
      startY: 120,
      head: [["Producto", "Cantidad"]],
      body: rows
    });

    mostrarPreview(doc);
  };

  // ================ 14. Inversión vs. Precio de Venta ================
  const inversionVsPrecioVenta = () => {
    // Para cada producto: calculamos total de compra y total de venta
    const rows = productos.map((p) => {
      // Inversión con stock
      const compUni = p.precio_compra_unidad || 0;
      const compQtl = p.precio_compra_quintal || 0;
      const upq = p.unidades_por_quintal || 1;
      const quints = Math.floor(p.stock / upq);
      const sob = p.stock % upq;
      const inversion = quints * compQtl + sob * compUni;

      // Valor venta (precio * stock) simplificado, si lo vendieras todo
      // (asumiendo precio = precio de unidad)
      const totalVenta = p.precio * p.stock;

      return [
        p.nombre,
        `Q${inversion.toFixed(2)}`,
        `Q${totalVenta.toFixed(2)}`
      ];
    });
    generarReporteSimple(
      "Inversión vs. Precio de Venta (Stock Teórico)",
      ["Producto", "Inversión Calculada", "Valor Venta"],
      rows
    );
  };

  // ================ 15. Resumen de Ventas (Tickets Totales, Monto) ================
  const resumenVentasGeneral = () => {
    // Suponiendo que cada item en facturasDetalle corresponde a 1 lineItem
    // Podríamos agrupar por id de factura, etc.
    const filtrados = filtrarPorFecha(facturasDetalle);
    const facturasUnicas = new Set(filtrados.map(f => f.factura));
    const total = filtrados.reduce((sum, f) => sum + totalVenta(f), 0);

    const rows = [
      ["Cantidad de Facturas (en rango)", facturasUnicas.size],
      ["Total Facturado", `Q${total.toFixed(2)}`]
    ];
    generarReporteSimple("Resumen General de Ventas", ["Detalle", "Valor"], rows);
  };

  return (
    <Box p={6} bg="gray.900" color="white" minH="100vh">
      <Heading mb={4}>Centro de Reportes (15+ Reportes)</Heading>

      <VStack spacing={2} align="start">
        <Text>Filtros de fechas (opcional):</Text>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

        {/* 1 */}
        <Button onClick={top15MasVendidos}>Top 15 Más Vendidos</Button>
        {/* 2 */}
        <Button onClick={masVendidosPorMes}>Más Vendidos por Mes</Button>
        {/* 3 */}
        <Button onClick={masVendidosPorAnio}>Más Vendidos por Año</Button>
        {/* 4 */}
        <Button onClick={inversionTotal}>Inversión Total</Button>
        {/* 5 */}
        <Button onClick={inversionPorCategoria}>Inversión por Categoría</Button>
        {/* 6 */}
        <Button onClick={reporteStockBajo}>Stock Bajo</Button>
        {/* 7 */}
        <Button onClick={reporteStockAlto}>Stock Alto (Top 20)</Button>
        {/* 8 */}
        <Button onClick={ventasPorDiaRango}>Ventas por Día (rango)</Button>
        {/* 9 */}
        <Button onClick={ventasPorMes}>Ventas por Mes</Button>
        {/* 10 */}
        <Button onClick={ventasPorAnio}>Ventas por Año</Button>
        {/* 11 */}
        <Button onClick={gananciaPorMes}>Ganancia por Mes</Button>
        {/* 12 */}
        <Button onClick={gananciaPorAnio}>Ganancia por Año</Button>
        {/* 13 */}
        <Button onClick={productosMasVendidosGrafica}>Gráfico: Más Vendidos</Button>
        {/* 14 */}
        <Button onClick={inversionVsPrecioVenta}>Inversión vs. Precio Venta</Button>
        {/* 15 */}
        <Button onClick={resumenVentasGeneral}>Resumen de Ventas General</Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Vista Previa del Reporte</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {previewUrl && (
              <iframe
                src={previewUrl}
                width="100%"
                height="600px"
                style={{ border: "none" }}
              />
            )}
            <Box mt={4} textAlign="right">
              <Button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.download = `reporte_${new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace(/[:T]/g, "-")}.pdf`;
                  a.click();
                }}
                colorScheme="green"
              >
                Descargar PDF
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Reportes;
