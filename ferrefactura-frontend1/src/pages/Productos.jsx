// src/pages/Productos.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaBox, FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";

function Productos() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Gestión de Productos</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <Link to="/productos/agregar" className="gestion-btn">
          <FaPlus size={24} /> Agregar Producto
        </Link>
        <Link to="/productos/actualizar" className="gestion-btn">
          <FaEdit size={24} /> Actualizar Producto
        </Link>
        <Link to="/productos/eliminar" className="gestion-btn">
          <FaTrash size={24} /> Eliminar Producto
        </Link>
        <Link to="/productos/ver" className="gestion-btn">
          <FaEye size={24} /> Ver Productos
        </Link>
      </div>
    </div>
  );
}

export default Productos;
