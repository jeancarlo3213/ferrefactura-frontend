import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

/* páginas */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Facturas from "./pages/Facturas";
import Usuarios from "./pages/Usuarios";
import Productos from "./pages/Productos";
import VerFacturaDetalle from "./pages/VerFacturaDetalle";
import CrearFactura from "./pages/CrearFactura";
import AgregarProducto from "./pages/AgregarProducto";
import ActualizarProducto from "./pages/ActualizarProducto";
import EliminarProducto from "./pages/EliminarProducto";
import VerProductos from "./pages/VerProductos";
import Administrador from "./pages/Administrador";
import Historial from "./pages/Historial";
import CajaDiaria from "./pages/CajaDiaria";
import Deudores from "./pages/Deudores";
import EditarFactura from "./pages/EditarFactura";
import Reportes from "./pages/Reportes";

/* utils */
import { isAuthenticated } from "./api/auth";

/* Tema: selector flotante */
import ThemeSwitcher from "./components/ThemeSwitcher";

/* Limpieza:
   - NO importes './styles/App.css' (rompe el layout)
   - Importa 'antd/dist/reset.css' solo si usas componentes de Ant Design en TODA la app.
*/
// import 'antd/dist/reset.css';

const PrivateRoute = ({ element }) => (isAuthenticated() ? element : <Navigate to="/login" />);

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verfactura/:id" element={<VerFacturaDetalle />} />

        {/* privadas */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/facturas" element={<PrivateRoute element={<Facturas />} />} />
        <Route path="/usuarios" element={<PrivateRoute element={<Usuarios />} />} />
        <Route path="/productos" element={<PrivateRoute element={<Productos />} />} />
        <Route path="/crearfactura" element={<PrivateRoute element={<CrearFactura />} />} />
        <Route path="/productos/agregar" element={<PrivateRoute element={<AgregarProducto />} />} />
        <Route path="/productos/actualizar" element={<PrivateRoute element={<ActualizarProducto />} />} />
        <Route path="/productos/eliminar" element={<PrivateRoute element={<EliminarProducto />} />} />
        <Route path="/productos/ver" element={<PrivateRoute element={<VerProductos />} />} />
        <Route path="/administrador" element={<PrivateRoute element={<Administrador />} />} />
        <Route path="/historial" element={<PrivateRoute element={<Historial />} />} />
        <Route path="/caja-diaria" element={<PrivateRoute element={<CajaDiaria />} />} />
        <Route path="/deudores" element={<PrivateRoute element={<Deudores />} />} />
        <Route path="/editarfactura/:id" element={<PrivateRoute element={<EditarFactura />} />} />
        <Route path="/reportes" element={<PrivateRoute element={<Reportes />} />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* selector de tema global */}
      <ThemeSwitcher />
    </>
  );
}
