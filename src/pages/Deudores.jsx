import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Table,
  Button,
  message,
  Typography,
  Modal,
  Input,
  Form,
  Spin
} from "antd";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const { Title } = Typography;

function ListaDeudores() {
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===========
  // MODALES
  // ===========
  const [modalVisibleAbonar, setModalVisibleAbonar] = useState(false);
  const [loadingAbono, setLoadingAbono] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [formAbonar] = Form.useForm();

  const [modalVisibleEditar, setModalVisibleEditar] = useState(false);
  const [selectedDeudaEditar, setSelectedDeudaEditar] = useState(null);
  const [formEditar] = Form.useForm();

  // ===========
  // BÚSQUEDA
  // ===========
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchDeudores();
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Obtener la lista de deudores (registros de deudas)
  // ──────────────────────────────────────────────────────────────
  const fetchDeudores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const response = await axios.get(`${API_URL}/registros-deudas/`, { headers });
      setDeudores(response.data);
    } catch {
      message.error("Error al cargar deudores");
    }
    setLoading(false);
  };

  // ──────────────────────────────────────────────────────────────
  // ABONAR UNA DEUDA
  // ──────────────────────────────────────────────────────────────
  const handleAbonarDeuda = async (values) => {
    setLoadingAbono(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      if (!selectedDeudor) {
        message.error("Debe seleccionar un deudor válido.");
        setLoadingAbono(false);
        return;
      }

      const cantidadDeuda = parseFloat(selectedDeudor.cantidad);
      const cantidadAbonada = parseFloat(values.cantidad_pagada);

      if (cantidadAbonada <= 0) {
        message.error("El monto debe ser mayor a 0.");
        setLoadingAbono(false);
        return;
      }

      if (cantidadAbonada > cantidadDeuda) {
        message.error("El abono no puede ser mayor a la deuda.");
        setLoadingAbono(false);
        return;
      }

      // Nueva cantidad después del abono
      const nuevaCantidadDeuda = cantidadDeuda - cantidadAbonada;

      // Actualizar la deuda en /registros-deudas/
      // Si llega a 0 => Ponemos comentario = "PAGADO"
      await axios.patch(
        `${API_URL}/registros-deudas/${selectedDeudor.id}/`,
        {
          cantidad: nuevaCantidadDeuda,
          comentario: nuevaCantidadDeuda === 0 ? "PAGADO" : selectedDeudor.comentario
        },
        { headers }
      );

      // Si la deuda llega a 0, también marcamos el deudor como "Pagado"
      if (nuevaCantidadDeuda === 0) {
        await axios.patch(
          `${API_URL}/deudores/${selectedDeudor.deudor}/`,
          { estado: "Pagado" },
          { headers }
        );
      }

      message.success("Abono registrado correctamente.");
      setModalVisibleAbonar(false);
      fetchDeudores();
    } catch (error) {
      console.error("Error al abonar:", error.response?.data);
      message.error(error.response?.data?.message || "Error al registrar abono");
    }
    setLoadingAbono(false);
  };

  // ──────────────────────────────────────────────────────────────
  // EDITAR UNA DEUDA EXISTENTE
  // ──────────────────────────────────────────────────────────────
  const handleEditarDeuda = async (values) => {
    if (!selectedDeudaEditar) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      // Hacemos PATCH en /registros-deudas/<id>/
      await axios.patch(
        `${API_URL}/registros-deudas/${selectedDeudaEditar.id}/`,
        {
          cantidad: values.cantidad,
          descripcion: values.descripcion,
          comentario: values.comentario
        },
        { headers }
      );

      message.success("Deuda actualizada correctamente.");
      setModalVisibleEditar(false);
      formEditar.resetFields();
      fetchDeudores();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Error al editar la deuda"
      );
    }
  };

  // ──────────────────────────────────────────────────────────────
  // PREPARAR DATOS FILTRADOS POR BÚSQUEDA
  // ──────────────────────────────────────────────────────────────
  const filteredDeudores = deudores.filter((item) =>
    item.deudor_nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  // ──────────────────────────────────────────────────────────────
  // Columnas de la tabla
  // ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Nombre",
      dataIndex: "deudor_nombre",
      key: "deudor_nombre"
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion"
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad"
    },
    {
      title: "Comentario",
      dataIndex: "comentario",
      key: "comentario",
      render: (text) => (
        <span
          style={
            text === "PAGADO"
              ? { color: "green", fontWeight: "bold" }
              : {}
          }
        >
          {text}
        </span>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (text) => (
        <span
          style={{
            color: text === "Pagado" ? "green" : "red",
            fontWeight: "bold"
          }}
        >
          {text}
        </span>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          {/* Botón ABONAR (solo si la deuda no está Pagada) */}
          {record.estado !== "Pagado" && (
            <Button
              type="primary"
              style={{
                backgroundColor: "#FF7F50",
                borderColor: "#FF4500",
                color: "white"
              }}
              onClick={() => {
                setSelectedDeudor(record);
                formAbonar.setFieldsValue({ cantidad_pagada: "" });
                setModalVisibleAbonar(true);
              }}
            >
              💳 Abonar
            </Button>
          )}

          {/* Botón EDITAR (siempre disponible, por si se quiere actualizar la descripción, etc.) */}
          <Button
            type="primary"
            style={{
              backgroundColor: "#007BFF",
              borderColor: "#0069D9",
              color: "white"
            }}
            onClick={() => {
              setSelectedDeudaEditar(record);
              // Prellenar el formulario con los datos actuales
              formEditar.setFieldsValue({
                cantidad: record.cantidad,
                descripcion: record.descripcion,
                comentario: record.comentario
              });
              setModalVisibleEditar(true);
            }}
          >
            ✏️ Editar
          </Button>
        </div>
      )
    }
  ];

  // ──────────────────────────────────────────────────────────────
  // RETURN del componente
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-blue-300">
        📝 Lista de Deudores
      </Title>
      <Link to="/administrador" className="text-blue-400 underline">
        ⬅ Volver al Administrador
      </Link>

      {/* Input de búsqueda */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Input
          placeholder="Buscar por nombre..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Card className="w-full max-w-6xl bg-gray-800 text-white shadow-lg">
        <Table
          dataSource={filteredDeudores}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* ──────────────────────────────────────────────────────────────
          MODAL - ABONAR A LA DEUDA
      ────────────────────────────────────────────────────────────── */}
      <Modal
        title="💰 Abonar a la Deuda"
        open={modalVisibleAbonar}
        onCancel={() => setModalVisibleAbonar(false)}
        footer={null}
      >
        <Form form={formAbonar} onFinish={handleAbonarDeuda} layout="vertical">
          <Form.Item label="Deudor">
            <Input
              value={selectedDeudor?.deudor_nombre || ""}
              disabled
            />
          </Form.Item>
          <Form.Item
            name="cantidad_pagada"
            label="Cantidad a Abonar"
            rules={[{ required: true, message: "Ingrese un monto válido" }]}
          >
            <Input type="number" min="1" step="1" placeholder="Ej: 150" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              backgroundColor: "#008000",
              borderColor: "#006400",
              color: "white"
            }}
            className="mt-2 w-full"
            disabled={loadingAbono}
          >
            {loadingAbono ? <Spin /> : "💾 Registrar Abono"}
          </Button>
        </Form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────
          MODAL - EDITAR DEUDA
      ────────────────────────────────────────────────────────────── */}
      <Modal
        title="✏️ Editar Deuda"
        open={modalVisibleEditar}
        onCancel={() => setModalVisibleEditar(false)}
        footer={null}
      >
        <Form form={formEditar} onFinish={handleEditarDeuda} layout="vertical">
          <Form.Item
            name="cantidad"
            label="Monto de la Deuda"
            rules={[{ required: true, message: "Ingrese un monto" }]}
          >
            <Input type="number" min="1" step="1" />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "Ingrese la descripción" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="comentario"
            label="Comentario"
            rules={[{ required: true, message: "Ingrese un comentario" }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              backgroundColor: "#008000",
              borderColor: "#006400",
              color: "white"
            }}
            className="mt-2 w-full"
          >
            Guardar Cambios
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default ListaDeudores;
