// src/pages/Usuarios.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaUserPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";

function Usuarios() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Gestión de Usuarios</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <Link to="/usuarios/agregar" className="gestion-btn">
          <FaUserPlus size={24} /> Agregar Usuario
        </Link>
        <Link to="/usuarios/actualizar" className="gestion-btn">
          <FaEdit size={24} /> Actualizar Usuario
        </Link>
        <Link to="/usuarios/eliminar" className="gestion-btn">
          <FaTrash size={24} /> Eliminar Usuario
        </Link>
        <Link to="/usuarios/ver" className="gestion-btn">
          <FaEye size={24} /> Ver Usuarios
        </Link>
      </div>
    </div>
  );
}
export default Usuarios;
