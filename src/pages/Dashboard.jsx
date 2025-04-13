import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  SimpleGrid,
  Button,
  VStack,
  IconButton,
} from "@chakra-ui/react";

import {
  FaUser,
  FaBox,
  FaFileInvoice,
  FaSignOutAlt,
  FaShieldAlt,
  FaBars,
  FaMoneyBillWave,
  FaChartBar, // Icono para Reportes
} from "react-icons/fa";

import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);
const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState({
    facturas_hoy: 0,
    facturas_mes: 0,
    total_ventas: 0,
    ganancias_mes: 0,
  });
  const [ventasDiarias, setVentasDiarias] = useState([]);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const [statsRes, dailyRes, monthlyRes] = await Promise.all([
        fetch(`${API_URL}/estadisticas-facturas/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_URL}/ventas-diarias/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_URL}/ventas-anuales/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      if (!statsRes.ok || !dailyRes.ok || !monthlyRes.ok)
        throw new Error("Error al obtener datos.");

      const statsData = await statsRes.json();
      const dailyData = await dailyRes.json();
      const monthlyData = await monthlyRes.json();

      setEstadisticas(statsData);
      setVentasDiarias(formatChartData(dailyData.ventas_por_dia, "Día"));
      setVentasMensuales(formatChartData(monthlyData.ventas_por_mes, "Mes"));
    } catch (err) {
      console.error("Error obteniendo datos:", err);
    }
  };

  const formatChartData = (data, label) => {
    return Object.keys(data).map((key) => ({
      name: `${label} ${key}`,
      value: data[key] || 0,
    }));
  };

  const ventasDiariasOptions = {
    title: { text: "Ventas por Día", left: "center" },
    tooltip: {},
    xAxis: { type: "category", data: ventasDiarias.map((item) => item.name) },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        data: ventasDiarias.map((item) => item.value),
        smooth: true,
      },
    ],
  };

  const ventasMensualesOptions = {
    title: { text: "Ventas por Mes", left: "center" },
    tooltip: {},
    xAxis: { type: "category", data: ventasMensuales.map((item) => item.name) },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: ventasMensuales.map((item) => item.value),
      },
    ],
  };

  return (
    <Box display="flex" minH="100vh" bg="gray.900" color="white">
      {/* Menú lateral */}
      <Box w={menuOpen ? "250px" : "80px"} bg="gray.800" p="5" minH="100vh" transition="0.3s">
        <IconButton
          icon={<FaBars />}
          onClick={() => setMenuOpen(!menuOpen)}
          colorScheme="teal"
          mb="5"
        />
        <VStack spacing="4">
          <Button as={Link} to="/usuarios" leftIcon={<FaUser />} variant="ghost" w="full">
            Usuarios
          </Button>
          <Button as={Link} to="/productos" leftIcon={<FaBox />} variant="ghost" w="full">
            Productos
          </Button>
          <Button as={Link} to="/facturas" leftIcon={<FaFileInvoice />} variant="ghost" w="full">
            Facturas
          </Button>
          <Button as={Link} to="/deudores" leftIcon={<FaMoneyBillWave />} colorScheme="yellow" w="full">
            Deudores
          </Button>
          <Button as={Link} to="/administrador" leftIcon={<FaShieldAlt />} colorScheme="purple" w="full">
            Administrador
          </Button>

          {/* ✅ Botón nuevo para acceder a Reportes */}
          <Button as={Link} to="/reportes" leftIcon={<FaChartBar />} colorScheme="teal" w="full">
            Reportes
          </Button>

          <Button onClick={() => navigate("/login")} leftIcon={<FaSignOutAlt />} colorScheme="red" w="full">
            Cerrar Sesión
          </Button>
        </VStack>
      </Box>

      {/* Contenido principal */}
      <Box flex="1" p="6">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb="6">
          Panel de Control
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={6}>
          {Object.entries(estadisticas).map(([key, value], index) => (
            <MotionBox
              key={index}
              p="6"
              bgGradient="linear(to-r, blue.500, blue.700)"
              borderRadius="md"
              textAlign="center"
              shadow="md"
              whileHover={{ scale: 1.05 }}
            >
              <Text fontSize="md" fontWeight="bold">
                {key.replace("_", " ").toUpperCase()}
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {value}
              </Text>
            </MotionBox>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <MotionBox p="6" bg="gray.800" borderRadius="md" shadow="md" whileHover={{ scale: 1.05 }}>
            <ReactECharts option={ventasDiariasOptions} />
          </MotionBox>
          <MotionBox p="6" bg="gray.800" borderRadius="md" shadow="md" whileHover={{ scale: 1.05 }}>
            <ReactECharts option={ventasMensualesOptions} />
          </MotionBox>
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default Dashboard;
