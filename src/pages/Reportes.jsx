import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Wrap,
  WrapItem,
  useDisclosure
} from "@chakra-ui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";

import "../styles/reportes.css";

const API = import.meta.env.VITE_API_URL;

/* ───── helpers de fetch y cálculo ───── */

const withToken = (url) => {
  const t = localStorage.getItem("token");
  return fetch(url, { headers: { Authorization: `Token ${t}` } });
};

const calcInv = (p) => {
  const { stock, precio_compra_unidad: u, precio_compra_quintal: q, unidades_por_quintal: n } = p;
  if (u && q && n) return Math.floor(stock / n) * q + (stock % n) * u;
  if (u) return stock * u;
  return 0;
};

const incompleto = (p) =>
  (!p.precio_compra_unidad && !p.precio_compra_quintal) ||
  (p.precio_compra_quintal && !p.unidades_por_quintal) ||
  (p.unidades_por_quintal && !p.precio_compra_quintal);

/* ───── componente ───── */

export default function Reportes() {
  const [productos, setProductos] = useState([]);
  const [det, setDet] = useState([]);
  const [logo, setLogo] = useState(null);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [pdfUrl, setPdfUrl] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    (async () => {
      await Promise.all([getLogo(), getProductos(), getFacturas()]);
    })();
  }, []);

  const getLogo = async () => {
    try {
      const r = await fetch("/Logo.jpeg");
      const b = await r.blob();
      const fr = new FileReader();
      fr.onloadend = () => setLogo(fr.result);
      fr.readAsDataURL(b);
    } catch {
      console.warn("Logo no encontrado");
    }
  };

  const getProductos = async () => {
    const r = await withToken(`${API}/productos/`);
    setProductos(await r.json());
  };

  const getFacturas = async () => {
    const r = await withToken(`${API}/facturas/`);
    const f = await r.json();
    setDet(
      f.flatMap((fac) =>
        fac.detalles.map((d) => ({
          ...d,
          fecha: fac.fecha_creacion,
          producto_id: d.producto,
          factura: fac.id
        }))
      )
    );
  };

  /* ───── utilidades PDF ───── */

  const hdr = (doc, ttl) => {
    if (logo) doc.addImage(logo, "JPEG", 10, 10, 25, 25);
    doc.setFontSize(14);
    doc.text(ttl, 45, 18);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString("es-GT")}`, 45, 24);
  };

  const abrir = (doc) => {
    setPdfUrl(URL.createObjectURL(doc.output("blob")));
    onOpen();
  };

  const tabla = (titulo, head, body) => {
    const doc = new jsPDF();
    hdr(doc, titulo);
    autoTable(doc, { head: [head], body, startY: 35 });
    abrir(doc);
  };

  /* ───── helpers de números ───── */

  const filtroFecha = (arr) =>
    arr.filter((x) => {
      if (!x.fecha) return false;
      const d = new Date(x.fecha);
      const i = start ? new Date(start) : null;
      const f = end ? new Date(end) : null;
      if (i && d < i) return false;
      if (f && d > f) return false;
      return true;
    });

  const compra = (id, unidad) => {
    const p = productos.find((x) => x.id === id);
    return unidad ? parseFloat(p?.precio_compra_unidad || 0) : parseFloat(p?.precio_compra_quintal || 0);
  };
  const venta = (d) => d.cantidad * parseFloat(d.precio_unitario);
  const gan = (d) =>
    (parseFloat(d.precio_unitario) -
      (d.tipo_venta === "Unidad" ? compra(d.producto_id, true) : compra(d.producto_id, false))) * d.cantidad;

  /* ───── reportes (18) ───── */

  /* 1 Top 15 */
  const rTop15 = () => {
    const m = {};
    det.forEach((d) => (m[d.producto_nombre] = (m[d.producto_nombre] || 0) + d.cantidad));
    tabla("Top 15 vendidos", ["Producto", "Cant"], Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 15));
  };

  /* 2 Vendidos por mes */
  const rVendMes = () => {
    const r = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const m = d.fecha.slice(0, 7);
      r[m] = r[m] || {};
      r[m][d.producto_nombre] = (r[m][d.producto_nombre] || 0) + d.cantidad;
    });
    const rows = [];
    Object.entries(r).forEach(([mes, obj]) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([p, c]) => rows.push([mes, p, c]))
    );
    tabla("Más vendidos x Mes (Top 5)", ["Mes", "Producto", "Cant"], rows);
  };

  /* 3 Vendidos por año */
  const rVendAnio = () => {
    const r = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const y = d.fecha.slice(0, 4);
      r[y] = r[y] || {};
      r[y][d.producto_nombre] = (r[y][d.producto_nombre] || 0) + d.cantidad;
    });
    const rows = [];
    Object.entries(r).forEach(([y, obj]) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([p, c]) => rows.push([y, p, c]))
    );
    tabla("Más vendidos x Año (Top 5)", ["Año", "Producto", "Cant"], rows);
  };

  /* 4 Inv total producto */
  const rInvTotal = () => tabla("Inversión total", ["Producto", "Stock", "Inv"], productos.map((p) => [p.nombre, p.stock, `Q${calcInv(p).toFixed(2)}`]));

  /* 5 Inv por categoría */
  const rInvCat = () => {
    const cat = {};
    productos.forEach((p) => {
      const c = p.categoria || "Sin categoría";
      cat[c] = (cat[c] || 0) + calcInv(p);
    });
    tabla("Inversión x Categoría", ["Categoría", "Inv"], Object.entries(cat).map(([c, v]) => [c, `Q${v.toFixed(2)}`]));
  };

  /* 6 Stock bajo */
  const rStockBajo = () => tabla("Stock ≤ 5", ["Producto", "Stock"], productos.filter((p) => p.stock <= 5).map((p) => [p.nombre, p.stock]));

  /* 7 Stock alto */
  const rStockAlto = () =>
    tabla("Top 20 Stock", ["Producto", "Stock"], [...productos].sort((a, b) => b.stock - a.stock).slice(0, 20).map((p) => [p.nombre, p.stock]));

  /* 8 Ventas día */
  const rVentaDia = () => {
    const map = {};
    filtroFecha(det).forEach((d) => {
      const k = d.fecha.slice(0, 10);
      map[k] = (map[k] || 0) + venta(d);
    });
    tabla("Ventas x Día", ["Fecha", "Total"], Object.entries(map).map(([f, v]) => [f, `Q${v.toFixed(2)}`]));
  };

  /* 9 Ventas mes */
  const rVentaMes = () => {
    const map = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const k = d.fecha.slice(0, 7);
      map[k] = (map[k] || 0) + venta(d);
    });
    tabla("Ventas x Mes", ["Mes", "Total"], Object.entries(map).map(([m, v]) => [m, `Q${v.toFixed(2)}`]));
  };

  /* 10 Ventas año */
  const rVentaAnio = () => {
    const map = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const k = d.fecha.slice(0, 4);
      map[k] = (map[k] || 0) + venta(d);
    });
    tabla("Ventas x Año", ["Año", "Total"], Object.entries(map).map(([a, v]) => [a, `Q${v.toFixed(2)}`]));
  };

  /* 11 Gan Mes */
  const rGanMes = () => {
    const map = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const k = d.fecha.slice(0, 7);
      map[k] = (map[k] || 0) + gan(d);
    });
    tabla("Ganancia x Mes", ["Mes", "Gan"], Object.entries(map).map(([m, v]) => [m, `Q${v.toFixed(2)}`]));
  };

  /* 12 Gan Año */
  const rGanAnio = () => {
    const map = {};
    det.forEach((d) => {
      if (!d.fecha) return;
      const k = d.fecha.slice(0, 4);
      map[k] = (map[k] || 0) + gan(d);
    });
    tabla("Ganancia x Año", ["Año", "Gan"], Object.entries(map).map(([a, v]) => [a, `Q${v.toFixed(2)}`]));
  };

  /* 13 Gráfico top 10 */
  const rGrafico = async () => {
    const map = {};
    det.forEach((d) => (map[d.producto_nombre] = (map[d.producto_nombre] || 0) + d.cantidad));
    const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const canvas = document.createElement("canvas");
    new Chart(canvas, {
      type: "bar",
      data: { labels: top.map((t) => t[0]), datasets: [{ data: top.map((t) => t[1]) }] },
      options: { responsive: false, animation: false }
    });
    await new Promise((r) => setTimeout(r, 300));
    const doc = new jsPDF();
    hdr(doc, "Top 10 vendidos");
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 15, 35, 180, 80);
    autoTable(doc, { startY: 120, head: [["Prod", "Cant"]], body: top });
    abrir(doc);
  };

  /* 14 Inv vs Venta */
  const rInvVsVenta = () =>
    tabla(
      "Inversión vs Venta",
      ["Producto", "Inv", "Venta"],
      productos.map((p) => [p.nombre, `Q${calcInv(p).toFixed(2)}`, `Q${(p.precio * p.stock).toFixed(2)}`])
    );

  /* 15 Resumen rango */
  const rResumen = () => {
    const r = filtroFecha(det);
    const fact = new Set(r.map((d) => d.factura)).size;
    const total = r.reduce((s, d) => s + venta(d), 0);
    tabla("Resumen ventas (rango)", ["Detalle", "Valor"], [
      ["Facturas únicas", fact],
      ["Total facturado", `Q${total.toFixed(2)}`]
    ]);
  };

  /* 16 Sin compra */
  const rSinCompra = () => {
    const set = new Set();
    const rows = det
      .filter(
        (d) =>
          (d.tipo_venta === "Unidad" && !compra(d.producto_id, true)) ||
          (d.tipo_venta === "Quintal" && !compra(d.producto_id, false))
      )
      .filter((d) => {
        const k = `${d.producto_id}-${d.tipo_venta}`;
        if (set.has(k)) return false;
        set.add(k);
        return true;
      })
      .map((d) => {
        const p = productos.find((x) => x.id === d.producto_id);
        return [
          p?.nombre || d.producto_id,
          d.tipo_venta,
          p?.precio_compra_unidad ?? "–",
          p?.precio_compra_quintal ?? "–"
        ];
      });
    tabla("Productos vendidos sin precio compra", ["Prod", "Tipo", "Compra U", "Compra Q"], rows);
  };

  /* 17 Resumen Inv vs Venta TOTAL */
  const rInvGlobal = () => {
    const inv = productos.reduce((s, p) => s + calcInv(p), 0);
    const ven = productos.reduce((s, p) => s + p.precio * p.stock, 0);
    tabla("Global Inv vs Venta", ["Concepto", "Total"], [
      ["Inversión", `Q${inv.toFixed(2)}`],
      ["Valor Venta", `Q${ven.toFixed(2)}`],
      ["Gan teórica", `Q${(ven - inv).toFixed(2)}`]
    ]);
  };

  /* 18 Pie Inv x Cat */
  const rPieInvCat = async () => {
    const cat = {};
    productos.forEach((p) => {
      const c = p.categoria || "Sin categoría";
      cat[c] = (cat[c] || 0) + calcInv(p);
    });
    const labels = Object.keys(cat);
    const data = Object.values(cat);
    const canvas = document.createElement("canvas");
    new Chart(canvas, { type: "pie", data: { labels, datasets: [{ data }] }, options: { responsive: false } });
    await new Promise((r) => setTimeout(r, 300));
    const doc = new jsPDF();
    hdr(doc, "Pie Inv x Categoría");
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 40, 40, 130, 90);
    autoTable(doc, { startY: 140, head: [["Cat", "Inv"]], body: labels.map((l, i) => [l, `Q${data[i].toFixed(2)}`]) });
    abrir(doc);
  };

  /* ───── UI responsive (Wrap) ───── */

  return (
    <Box className="reportes-container">
      <Heading className="reportes-titulo">Centro de Reportes</Heading>

      <Box className="reportes-fechas">
        <Text mb={1}>Filtrar por fecha:</Text>
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      </Box>

      <Wrap spacing="8px">
        <WrapItem><Button variant="unstyled" className="reporte-btn blue" onClick={rTop15}>Top 15</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn teal" onClick={rVendMes}>Vend x Mes</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn indigo" onClick={rVendAnio}>Vend x Año</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn green" onClick={rInvTotal}>Inv Total</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn orange" onClick={rInvCat}>Inv x Cat</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn red" onClick={rStockBajo}>Stock ≤5</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn pink" onClick={rStockAlto}>Top Stock</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn blue" onClick={rVentaDia}>Ventas Día</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn teal" onClick={rVentaMes}>Ventas Mes</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn indigo" onClick={rVentaAnio}>Ventas Año</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn green" onClick={rGanMes}>Gan Mes</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn orange" onClick={rGanAnio}>Gan Año</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn purple" onClick={rGrafico}>Gráfico Top10</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn red" onClick={rInvVsVenta}>Inv vs Venta</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn pink" onClick={rResumen}>Resumen</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn gray" onClick={rSinCompra}>Faltan Precios</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn gray" onClick={rInvGlobal}>Global Inv/Vent</Button></WrapItem>
        <WrapItem><Button variant="unstyled" className="reporte-btn purple" onClick={rPieInvCat}>Pie Inv Cat</Button></WrapItem>
      </Wrap>

      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Vista previa</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} overflow="hidden">
  <Box width="100%" height="80vh" position="relative">
    {pdfUrl && (
      <iframe
        src={pdfUrl}
        title="Vista previa del PDF"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    )}
    <Box
      position="absolute"
      bottom="10px"
      right="10px"
      bg="white"
      px={4}
      py={2}
      boxShadow="md"
      borderRadius="md"
    >
      <Button
        className="reportes-descargar blue"
        onClick={() => {
          const a = document.createElement("a");
          a.href = pdfUrl;
          a.download = `reporte_${Date.now()}.pdf`;
          a.click();
        }}
      >
        Descargar PDF
      </Button>
    </Box>
  </Box>
</ModalBody>


        </ModalContent>
      </Modal>
    </Box>
  );
}
