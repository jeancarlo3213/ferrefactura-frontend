import React, { useEffect, useState } from "react";
import {
  Box, Button, Heading, VStack, Text,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useDisclosure
} from "@chakra-ui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";

const API_URL = import.meta.env.VITE_API_URL;

function Reportes() {
  const [productos, setProductos] = useState([]);
  const [facturasDetalle, setFacturasDetalle] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    obtenerDatos();
    cargarLogo();
  }, []);

  const cargarLogo = async () => {
    const response = await fetch("/Logo.jpeg");
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result);
    reader.readAsDataURL(blob);
  };

  const obtenerDatos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const [resProd, resFact] = await Promise.all([
        fetch(`${API_URL}/productos/`, { headers }),
        fetch(`${API_URL}/facturas-detalle/`, { headers })
      ]);
      setProductos(await resProd.json());
      setFacturasDetalle(await resFact.json());
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  const calcularInversion = (p) => {
    if (p.precio_quintal && p.unidades_por_quintal) {
      const quintales = Math.floor(p.stock / p.unidades_por_quintal);
      const sobrantes = p.stock % p.unidades_por_quintal;
      return (quintales * p.precio_quintal) + (sobrantes * p.precio);
    } else {
      return p.stock * p.precio;
    }
  };

  const mostrarPreview = (doc) => {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    onOpen();
  };

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

  const generarPDFProductos = () => {
    const doc = new jsPDF();
    agregarEncabezado(doc, "Reporte de Productos");
    const rows = productos.map(p => [
      p.nombre,
      p.categoria || "-",
      p.stock,
      `Q${parseFloat(p.precio).toFixed(2)}`,
      `Q${calcularInversion(p).toFixed(2)}`
    ]);
    autoTable(doc, {
      head: [["Nombre", "Categoría", "Stock", "Precio", "Inversión"]],
      body: rows,
      startY: 35
    });
    mostrarPreview(doc);
  };

  const generarPDFPorCategoria = () => {
    const categorias = {};
    productos.forEach(p => {
      const key = (p.categoria || "Sin Categoría").toLowerCase();
      const inv = calcularInversion(p);
      if (!categorias[key]) categorias[key] = { cantidad: 0, inversion: 0 };
      categorias[key].cantidad++;
      categorias[key].inversion += inv;
    });
    const rows = Object.entries(categorias).map(([cat, data]) => [
      cat,
      data.cantidad,
      `Q${data.inversion.toFixed(2)}`
    ]);
    const doc = new jsPDF();
    agregarEncabezado(doc, "Reporte por Categoría");
    autoTable(doc, {
      head: [["Categoría", "Cantidad de productos", "Inversión total"]],
      body: rows,
      startY: 35
    });
    mostrarPreview(doc);
  };

  const generarPDFStockBajo = () => {
    const rows = productos.filter(p => p.stock <= 5).map(p => [
      p.nombre,
      p.categoria || "-",
      p.stock
    ]);
    const doc = new jsPDF();
    agregarEncabezado(doc, "Productos con Bajo Stock");
    autoTable(doc, {
      head: [["Nombre", "Categoría", "Stock"]],
      body: rows,
      startY: 35
    });
    mostrarPreview(doc);
  };

  const generarPDFInversionTotal = () => {
    const totalProductos = productos.length;
    const totalInversion = productos.reduce((sum, p) => sum + calcularInversion(p), 0);
    const doc = new jsPDF();
    agregarEncabezado(doc, "Resumen de Inversión Total");
    doc.setFontSize(12);
    doc.text(`Total de productos registrados: ${totalProductos}`, 14, 40);
    doc.text(`Inversión total estimada: Q${totalInversion.toFixed(2)}`, 14, 50);
    mostrarPreview(doc);
  };

  const generarPDFProductosMasVendidos = async () => {
    const acumulado = {};
    facturasDetalle.forEach(f => {
      const nombre = f.producto_nombre;
      if (!acumulado[nombre]) acumulado[nombre] = { cantidad: 0, total: 0 };
      acumulado[nombre].cantidad += f.cantidad;
      acumulado[nombre].total += f.cantidad * parseFloat(f.precio_unitario);
    });

    const sorted = Object.entries(acumulado)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 10);

    const doc = new jsPDF();
    agregarEncabezado(doc, "Productos Más Vendidos");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map(([nombre]) => nombre),
        datasets: [{
          label: "Cantidad Vendida",
          data: sorted.map(([, data]) => data.cantidad),
          backgroundColor: "#3182ce"
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 14, 35, 180, 60);

    const rows = sorted.map(([nombre, data]) => [
      nombre,
      data.cantidad,
      `Q${data.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 100,
      head: [["Producto", "Cantidad Vendida", "Total Facturado"]],
      body: rows
    });

    mostrarPreview(doc);
  };

  return (
    <Box p={6} bg="gray.900" color="white" minH="100vh">
      <Heading mb={6}>📊 Centro de Reportes</Heading>
      <VStack align="start" spacing={4}>
        <Button colorScheme="teal" onClick={generarPDFProductos}>📦 Productos e Inversión</Button>
        <Button colorScheme="blue" onClick={generarPDFPorCategoria}>📂 Por Categoría</Button>
        <Button colorScheme="purple" onClick={generarPDFProductosMasVendidos}>🔥 Más Vendidos (con gráfico)</Button>
        <Button colorScheme="orange" onClick={generarPDFStockBajo}>⚠️ Stock Bajo</Button>
        <Button colorScheme="green" onClick={generarPDFInversionTotal}>💼 Inversión Total</Button>
        <Text fontSize="sm" mt={4} color="gray.400">(Reportes listos para descargar o imprimir)</Text>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Vista previa del reporte</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {previewUrl && (
              <iframe src={previewUrl} width="100%" height="600px" style={{ border: "none" }} />
            )}
            <Box mt={4} textAlign="right">
              <Button onClick={() => {
                const a = document.createElement("a");
                a.href = previewUrl;
                a.download = `reporte_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;
                a.click();
              }} colorScheme="green">
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

