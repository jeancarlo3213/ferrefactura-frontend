import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Facturas from "./pages/Facturas";
import Usuarios from "./pages/Usuarios";
import Productos from "./pages/Productos";
import VerFacturaDetalle from "./pages/VerFacturaDetalle";
import CrearFactura from "./pages/CrearFactura"; // Asegurar importación correcta
import "./styles/App.css";
import { isAuthenticated } from "./api/auth";
import 'antd/dist/reset.css';
import AgregarProducto from "./pages/AgregarProducto";
import ActualizarProducto from "./pages/ActualizarProducto";
import EliminarProducto from "./pages/EliminarProducto";
import VerProductos from "./pages/VerProductos";
import Administrador from "./pages/Administrador";
import Historial from "./pages/Historial";
import CajaDiaria from "./pages/CajaDiaria";
import Deudores from "./pages/Deudores";
import EditarFactura from "./pages/editarfactura";

const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verfactura/:id" element={<VerFacturaDetalle />} />
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/facturas" element={<PrivateRoute element={<Facturas />} />} />
        <Route path="/usuarios" element={<PrivateRoute element={<Usuarios />} />} />
        <Route path="/productos" element={<PrivateRoute element={<Productos />} />} />
        <Route path="/crearfactura" element={<PrivateRoute element={<CrearFactura />} />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/agregar" element={<AgregarProducto />} />
        <Route path="/productos/actualizar" element={<ActualizarProducto />} />
        <Route path="/productos/eliminar" element={<EliminarProducto />} />
        <Route path="/productos/ver" element={<VerProductos />} />
        <Route path="/administrador" element={<Administrador />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/caja-diaria" element={<CajaDiaria />} />
        <Route path="/deudores" element={<Deudores />} />
        <Route path="/editarfactura/:id" element={<EditarFactura />} />
      </Routes>
    </>
  );
}

export default App;
