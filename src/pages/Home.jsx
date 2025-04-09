import React from "react";
import { Link } from "react-router-dom";
import { FaSignInAlt } from "react-icons/fa";
import { motion } from "framer-motion";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-slate-900 text-white px-6">
      
      {/* Título principal animado */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-5xl font-extrabold mb-4">
          Bienvenido a <span className="text-blue-400">Ferretería Campesino</span>
        </h1>
        <p className="text-xl mb-8 italic">
          Tu mejor aliado en construcción y hogar.
        </p>
      </motion.div>

      {/* Cards con información */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 hover:shadow-xl transition hover:scale-105"
        >
          <h2 className="text-xl font-semibold mb-2">Productos y Servicios</h2>
          <p className="text-sm">
            Desde clavos hasta cemento: todo para tu obra y hogar en un solo lugar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 hover:shadow-xl transition hover:scale-105"
        >
          <h2 className="text-xl font-semibold mb-2">Ubicación Estratégica</h2>
          <p className="text-sm">
            Estamos en el corazón de tu comunidad para darte una atención rápida y cercana.
          </p>
        </motion.div>
      </div>

      {/* Botón de inicio de sesión animado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-700 transition shadow-md"
        >
          <FaSignInAlt size={20} />
          Iniciar Sesión
        </Link>
      </motion.div>
    </div>
  );
}

export default Home;
