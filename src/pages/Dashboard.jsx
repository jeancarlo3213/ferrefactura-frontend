import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars, FaUser, FaBox, FaFileInvoice, FaMoneyBillWave,
  FaShieldAlt, FaChartBar, FaSignOutAlt
} from "react-icons/fa";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import "../styles/dashboard.css"; // estilos del dashboard (oscuro pro)

const RAW_API = import.meta.env.VITE_API_URL || "";
const normalizeBase = (url) => url?.replace(/\/+$/, "") || "";
const withBase = (path) => `${normalizeBase(RAW_API)}${path.startsWith("/") ? path : `/${path}`}`;

const fmtQ = (n) =>
  `Q${(Number.isFinite(n) ? n : 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");
        const headers = { "Content-Type": "application/json", Authorization: `Token ${token}` };

        const [prodRes, facRes] = await Promise.all([
          fetch(withBase("/productos/"), { headers }),
          fetch(withBase("/facturas/"), { headers }),
        ]);

        if (!prodRes.ok) throw new Error(`Productos ${prodRes.status} en ${prodRes.url}`);
        if (!facRes.ok) throw new Error(`Facturas ${facRes.status} en ${facRes.url}`);

        const prods = await prodRes.json();
        const fact = await facRes.json();

        setProductos(Array.isArray(prods) ? prods : []);
        setDetalles(
          (Array.isArray(fact) ? fact : []).flatMap((f) =>
            (f.detalles || []).map((d) => ({ ...d, fecha: f.fecha_creacion, facturaId: f.id }))
          )
        );
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const {
    totalProductos, stockBajo, inversionTotal, valorVentaTotal,
    gananciaTeorica, ventasMesArr, ventasAnioArr, top5, last5
  } = useMemo(() => {
    const totalProductos = productos.length;
    const stockBajo = productos.filter((p) => p.stock <= 5).length;
    const inversionTotal = productos.reduce((s, p) => s + calcInv(p), 0);
    const valorVentaTotal = productos.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0);
    const gananciaTeorica = valorVentaTotal - inversionTotal;

    const ventasMes = {};
    const ventasAnio = {};
    const sold = {};

    for (const d of detalles) {
      if (!d?.fecha) continue;
      const pu = parseFloat(d.precio_unitario);
      const total = (d.cantidad || 0) * (Number.isFinite(pu) ? pu : 0);
      const keyM = d.fecha.slice(0, 7);
      const keyY = d.fecha.slice(0, 4);
      ventasMes[keyM] = (ventasMes[keyM] || 0) + total;
      ventasAnio[keyY] = (ventasAnio[keyY] || 0) + total;
      const name = d.producto_nombre || "Producto";
      sold[name] = (sold[name] || 0) + (d.cantidad || 0);
    }

    const ventasMesArr = Object.entries(ventasMes).sort();
    const ventasAnioArr = Object.entries(ventasAnio).sort();
    const top5 = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const last5 = [...detalles]
      .filter((x) => x?.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map((d) => ({
        id: d.facturaId,
        fecha: d.fecha.slice(0, 10),
        prod: d.producto_nombre,
        total: ((d.cantidad || 0) * parseFloat(d.precio_unitario || 0)).toFixed(2),
      }));

    return {
      totalProductos, stockBajo, inversionTotal, valorVentaTotal,
      gananciaTeorica, ventasMesArr, ventasAnioArr, top5, last5
    };
  }, [productos, detalles]);

  const optVentasMes = {
    backgroundColor: "transparent",
    textStyle: { color: "#e7eaf0" },
    title: { text: "Ventas por Mes", left: "center", textStyle: { color: "#e7eaf0" } },
    grid: { left: 45, right: 10, top: 40, bottom: 35 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ventasMesArr.map((d) => d[0]), axisLabel: { color: "#9aa3b2" }, axisLine: { lineStyle: { color: "#2a2f3a" } } },
    yAxis: { type: "value", axisLabel: { color: "#9aa3b2" }, splitLine: { lineStyle: { color: "#22252f" } } },
    series: [{ type: "line", smooth: true, data: ventasMesArr.map((d) => d[1]) }],
    color: ["#60a5fa"],
  };

  const optVentasAnio = {
    backgroundColor: "transparent",
    textStyle: { color: "#e7eaf0" },
    title: { text: "Ventas por Año", left: "center", textStyle: { color: "#e7eaf0" } },
    grid: { left: 45, right: 10, top: 40, bottom: 35 },
    tooltip: {},
    xAxis: { type: "category", data: ventasAnioArr.map((d) => d[0]), axisLabel: { color: "#9aa3b2" }, axisLine: { lineStyle: { color: "#2a2f3a" } } },
    yAxis: { type: "value", axisLabel: { color: "#9aa3b2" }, splitLine: { lineStyle: { color: "#22252f" } } },
    series: [{ type: "bar", data: ventasAnioArr.map((d) => d[1]) }],
    color: ["#818cf8"],
  };

  const optPie = {
    backgroundColor: "transparent",
    title: { text: "Top 5 Vendidos", left: "center", textStyle: { color: "#e7eaf0" } },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", textStyle: { color: "#9aa3b2" } },
    series: [{ name: "Producto", type: "pie", radius: ["40%", "70%"], avoidLabelOverlap: true, label: { show: false }, data: top5.map(([name, value]) => ({ name, value })) }],
    color: ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa"],
  };

  const metricCards = [
    { label: "TOTAL PRODUCTOS",   value: totalProductos },
    { label: "STOCK BAJO (≤5)",   value: stockBajo },
    { label: "INVERSIÓN TOTAL",   value: fmtQ(inversionTotal) },
    { label: "VALOR VENTA TOTAL", value: fmtQ(valorVentaTotal) },
    { label: "GANANCIA TEÓRICA",  value: fmtQ(gananciaTeorica) },
  ];

  return (
    <div className="dashboard">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Barra lateral de navegación">
        <button className="sidebar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir/cerrar menú">
          <FaBars />
        </button>

        <nav className="sidebar-nav">
          <Link to="/usuarios" className="sidebar-btn" title="Usuarios"><FaUser /><span>Usuarios</span></Link>
          <Link to="/productos" className="sidebar-btn" title="Productos"><FaBox /><span>Productos</span></Link>
          <Link to="/facturas" className="sidebar-btn" title="Facturas"><FaFileInvoice /><span>Facturas</span></Link>
          <Link to="/deudores" className="sidebar-btn" title="Deudores"><FaMoneyBillWave /><span>Deudores</span></Link>
          <Link to="/administrador" className="sidebar-btn" title="Administrador"><FaShieldAlt /><span>Admin</span></Link>
          <Link to="/reportes" className="sidebar-btn" title="Reportes"><FaChartBar /><span>Reportes</span></Link>
          <button onClick={() => navigate("/login")} className="sidebar-btn logout" title="Salir"><FaSignOutAlt /><span>Salir</span></button>
        </nav>
      </aside>

      <main className="main">
        <motion.h1 className="titulo" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
          Panel de Control
        </motion.h1>

        {loading && (
          <div className="metrics">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="metric-card" style={{ opacity:.6 }}>
                <div className="metric-label">Cargando…</div>
                <div className="metric-value">—</div>
              </div>
            ))}
          </div>
        )}

        {err && (
          <div role="alert" style={{ background:"#2b1d1d", border:"1px solid #512222", padding:"12px", borderRadius:12 }}>
            {err}
          </div>
        )}

        {!loading && !err && (
          <>
            <div className="metrics">
              {metricCards.map((m) => (
                <motion.div key={m.label} className="metric-card" whileHover={{ scale: 1.03 }}>
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-value">{m.value}</span>
                </motion.div>
              ))}
            </div>

            <div className="charts">
              <motion.div className="chart" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .4 }}>
                <ReactECharts option={optVentasMes} style={{ height: 260 }} />
              </motion.div>
              <motion.div className="chart" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .4, delay:.05 }}>
                <ReactECharts option={optVentasAnio} style={{ height: 260 }} />
              </motion.div>
              <motion.div className="chart" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .4, delay:.1 }}>
                <ReactECharts option={optPie} style={{ height: 260 }} />
              </motion.div>
            </div>

            <section className="ventas" aria-labelledby="ultimas-ventas">
              <h2 id="ultimas-ventas" className="ventas-titulo">Últimas Ventas</h2>
              {last5.length === 0 && <div className="text-muted" style={{ padding:"8px 2px" }}>Aún no hay ventas.</div>}
              {last5.map((v) => (
                <motion.button
                  key={`${v.id}-${v.fecha}`}
                  onClick={() => navigate(`/facturas/${v.id}`)}
                  className="venta-row"
                  whileHover={{ scale: 1.01 }}
                >
                  <span className="venta-fecha">{v.fecha}</span>
                  <span className="venta-prod">{v.prod}</span>
                  <span className="venta-total">{fmtQ(Number(v.total))}</span>
                </motion.button>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

