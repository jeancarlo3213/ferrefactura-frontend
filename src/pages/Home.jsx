// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaSignInAlt } from "react-icons/fa";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center p-4">
      <h1 className="text-4xl font-bold">Bienvenido a <span className="text-blue-400">FerreFactura</span></h1>
      <p className="text-lg mt-2">Gestiona tus facturas de forma sencilla.</p>

   
      <Link to="/login" className="mt-6 px-6 py-3 bg-blue-500 rounded-lg text-white font-semibold flex items-center gap-2 hover:bg-blue-600 transition">
        <FaSignInAlt size={20} /> Iniciar Sesión
      </Link>
    </div>
  );
}

export default Home;
