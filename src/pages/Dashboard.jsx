import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaUser,
  FaBox,
  FaFileInvoice,
  FaMoneyBillWave,
  FaShieldAlt,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";

import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL;

const calcInv = (p) => {
  const { stock, precio_compra_unidad: u, precio_compra_quintal: q, unidades_por_quintal: n } = p;
  if (u && q && n) return Math.floor(stock / n) * q + (stock % n) * u;
  if (u) return stock * u;
  return 0;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(true);
  const [productos, setProductos] = useState([]);
  const [detalles, setDetalles] = useState([]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const [prodRes, facRes] = await Promise.all([
        fetch(`${API}/productos/`, { headers }),
        fetch(`${API}/facturas/`, { headers }),
      ]);
      const prods = await prodRes.json();
      const fact = await facRes.json();
      setProductos(prods);
      setDetalles(
        fact.flatMap((f) => f.detalles.map((d) => ({ ...d, fecha: f.fecha_creacion, facturaId: f.id })))
      );
    })();
  }, []);

  const totalProductos = productos.length;
  const stockBajo = productos.filter((p) => p.stock <= 5).length;
  const inversionTotal = productos.reduce((s, p) => s + calcInv(p), 0);
  const valorVentaTotal = productos.reduce((s, p) => s + p.precio * p.stock, 0);
  const gananciaTeorica = valorVentaTotal - inversionTotal;

  const ventasMes = {};
  const ventasAnio = {};
  const sold = {};

  detalles.forEach((d) => {
    if (!d.fecha) return;
    const pu = parseFloat(d.precio_unitario);
    const total = d.cantidad * pu;
    const keyM = d.fecha.slice(0, 7);
    const keyY = d.fecha.slice(0, 4);
    ventasMes[keyM] = (ventasMes[keyM] || 0) + total;
    ventasAnio[keyY] = (ventasAnio[keyY] || 0) + total;
    sold[d.producto_nombre] = (sold[d.producto_nombre] || 0) + d.cantidad;
  });

  const ventasMesArr = Object.entries(ventasMes).sort();
  const ventasAnioArr = Object.entries(ventasAnio).sort();
  const top5 = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const optVentasMes = {
    title: { text: "Ventas por Mes", left: "center", textStyle: { color: "#fff" } },
    grid: { left: 45, right: 10, top: 40, bottom: 35 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ventasMesArr.map((d) => d[0]), axisLabel: { color: "#fff" } },
    yAxis: { type: "value", axisLabel: { color: "#fff" } },
    series: [{ type: "line", smooth: true, data: ventasMesArr.map((d) => d[1]) }],
    color: ["#60a5fa"],
  };

  const optVentasAnio = {
    title: { text: "Ventas por Año", left: "center", textStyle: { color: "#fff" } },
    grid: { left: 45, right: 10, top: 40, bottom: 35 },
    tooltip: {},
    xAxis: { type: "category", data: ventasAnioArr.map((d) => d[0]), axisLabel: { color: "#fff" } },
    yAxis: { type: "value", axisLabel: { color: "#fff" } },
    series: [{ type: "bar", data: ventasAnioArr.map((d) => d[1]) }],
    color: ["#818cf8"],
  };

  const optPie = {
    title: { text: "Top 5 Vendidos", left: "center", textStyle: { color: "#fff" } },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", textStyle: { color: "#fff" } },
    series: [
      {
        name: "Producto",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        label: { show: false },
        data: top5.map(([name, value]) => ({ name, value })),
      },
    ],
  };

  const last5 = [...detalles]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)
    .map((d) => ({
      id: d.facturaId,
      fecha: d.fecha.slice(0, 10),
      prod: d.producto_nombre,
      total: (d.cantidad * parseFloat(d.precio_unitario)).toFixed(2),
    }));

  const metricCards = [
    { label: "TOTAL PRODUCTOS", value: totalProductos },
    { label: "STOCK BAJO (≤5)", value: stockBajo },
    { label: "INVERSIÓN TOTAL", value: `Q${inversionTotal.toFixed(2)}` },
    { label: "VALOR VENTA TOTAL", value: `Q${valorVentaTotal.toFixed(2)}` },
    { label: "GANANCIA TEÓRICA", value: `Q${gananciaTeorica.toFixed(2)}` },
  ];

  return (
    <div className="dashboard flex">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="sidebar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars />
        </button>

        <nav className="sidebar-nav">
          <Link to="/usuarios" className="sidebar-btn"><FaUser />{menuOpen && "Usuarios"}</Link>
          <Link to="/productos" className="sidebar-btn"><FaBox />{menuOpen && "Productos"}</Link>
          <Link to="/facturas" className="sidebar-btn"><FaFileInvoice />{menuOpen && "Facturas"}</Link>
          <Link to="/deudores" className="sidebar-btn"><FaMoneyBillWave />{menuOpen && "Deudores"}</Link>
          <Link to="/administrador" className="sidebar-btn"><FaShieldAlt />{menuOpen && "Admin"}</Link>
          <Link to="/reportes" className="sidebar-btn"><FaChartBar />{menuOpen && "Reportes"}</Link>
          <button onClick={() => navigate("/login")} className="sidebar-btn logout">
            <FaSignOutAlt />{menuOpen && "Salir"}
          </button>
        </nav>
      </aside>

      <main className="main">
        <motion.h1
          className="titulo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Panel de Control
        </motion.h1>

        <div className="metrics">
          {metricCards.map((m) => (
            <motion.div
              key={m.label}
              className="metric-card"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <span className="metric-label">{m.label}</span>
              <span className="metric-value">{m.value}</span>
            </motion.div>
          ))}
        </div>

        <div className="charts">
          <motion.div
            className="chart"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ReactECharts option={optVentasMes} style={{ height: 240 }} />
          </motion.div>

          <motion.div
            className="chart"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ReactECharts option={optVentasAnio} style={{ height: 240 }} />
          </motion.div>

          <motion.div
            className="chart"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ReactECharts option={optPie} style={{ height: 240 }} />
          </motion.div>
        </div>

        <section className="ventas">
          <h2 className="ventas-titulo">Últimas Ventas</h2>
          {last5.map((v) => (
            <motion.button
              key={`${v.id}-${v.fecha}`}
              onClick={() => navigate(`/facturas/${v.id}`)}
              className="venta-row"
              whileHover={{ scale: 1.03 }}
            >
              <span className="venta-fecha">{v.fecha}</span>
              <span className="venta-prod">{v.prod}</span>
              <span className="venta-total">Q{v.total}</span>
            </motion.button>
          ))}
        </section>
      </main>
    </div>
  );
}
