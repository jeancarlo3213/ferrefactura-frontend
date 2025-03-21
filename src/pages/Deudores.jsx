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

  // Estado para modal de ABONAR
  const [modalVisibleAbonar, setModalVisibleAbonar] = useState(false);
  const [loadingAbono, setLoadingAbono] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [formAbonar] = Form.useForm();

  // Estado para modal de AGREGAR deudor
  const [modalVisibleAgregar, setModalVisibleAgregar] = useState(false);
  const [formAgregar] = Form.useForm();

  // Estado para modal de EDITAR deuda
  const [modalVisibleEditar, setModalVisibleEditar] = useState(false);
  const [selectedDeudaEditar, setSelectedDeudaEditar] = useState(null);
  const [formEditar] = Form.useForm();

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
  // 1) ABONAR UNA DEUDA
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

      // Obtener el último registro de caja
      const cajaResponse = await axios.get(`${API_URL}/caja-diaria/`, { headers });
      if (cajaResponse.data.length === 0) {
        message.error("No hay registros de caja disponibles.");
        setLoadingAbono(false);
        return;
      }

      const ultimaCaja = cajaResponse.data.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      )[0];

      // Datos del abono
      const pagoData = {
        deudor: selectedDeudor.deudor, // ID del deudor
        cantidad_pagada: cantidadAbonada,
        caja: ultimaCaja.id,
        comentario:
          values.comentario ||
          `Abono de Q${cantidadAbonada} a la deuda de ${selectedDeudor.deudor_nombre}.`
      };

      // Enviar el abono a la API
      await axios.post(`${API_URL}/pagos-deudas/`, pagoData, { headers });

      // Actualizar la deuda del deudor en /registros-deudas/
      const nuevaCantidadDeuda = cantidadDeuda - cantidadAbonada;
      await axios.patch(
        `${API_URL}/registros-deudas/${selectedDeudor.id}/`,
        { cantidad: nuevaCantidadDeuda },
        { headers }
      );

      // Si la deuda llega a 0, marcar al deudor en /deudores/ como "Pagado"
      if (nuevaCantidadDeuda === 0) {
        await axios.patch(
          `${API_URL}/deudores/${selectedDeudor.deudor}/`,
          { estado: "Pagado" },
          { headers }
        );
      }

      // Actualizar el último registro de caja
      const nuevoComentario = `${ultimaCaja.comentario} - Pago de deuda de ${selectedDeudor.deudor_nombre} por Q${cantidadAbonada}`;
      const cajaActualizada = {
        cuenta_banco: ultimaCaja.cuenta_banco,
        efectivo: parseFloat(ultimaCaja.efectivo) + cantidadAbonada,
        sencillo: ultimaCaja.sencillo,
        gastos: ultimaCaja.gastos,
        ingreso_extra: ultimaCaja.ingreso_extra,
        comentario: nuevoComentario
      };

      await axios.patch(`${API_URL}/caja-diaria/${ultimaCaja.id}/`, cajaActualizada, { headers });

      message.success("Abono registrado correctamente y caja actualizada.");
      setModalVisibleAbonar(false);
      fetchDeudores();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Error al registrar abono"
      );
    }
    setLoadingAbono(false);
  };

  // ──────────────────────────────────────────────────────────────
  // 2) AGREGAR NUEVO DEUDOR (Y SU DEUDA)
  // ──────────────────────────────────────────────────────────────
  const handleAgregarDeudor = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      // 1) Crear el deudor en la ruta /deudores/
      const deudorRes = await axios.post(
        `${API_URL}/deudores/`,
        { nombre: values.nombre }, // { "nombre": "Don X" }
        { headers }
      );
      const deudorId = deudorRes.data.id; // ID que responde la API

      // 2) Crear el registro de deuda en /registros-deudas/ con ese deudorId
      await axios.post(
        `${API_URL}/registros-deudas/`,
        {
          deudor: deudorId,
          descripcion: values.descripcion,
          cantidad: values.cantidad,
          comentario: values.comentario || "Pago pendiente"
        },
        { headers }
      );

      message.success("Deudor y deuda creados correctamente.");
      setModalVisibleAgregar(false);
      formAgregar.resetFields();
      fetchDeudores();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Error al crear el deudor"
      );
    }
  };

  // ──────────────────────────────────────────────────────────────
  // 3) EDITAR UNA DEUDA EXISTENTE (cantidad, descripción, etc.)
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
  // COLUMNA DE LA TABLA
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
      key: "comentario"
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
          {/* Botón ABONAR (si la deuda no está Pagada) */}
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

          {/* Botón EDITAR */}
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
  // RETURN
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-blue-300">
        📝 Lista de Deudores
      </Title>
      <Link to="/administrador" className="text-blue-400 underline">
        ⬅ Volver al Administrador
      </Link>

      {/* Botón para abrir modal de AGREGAR NUEVO DEUDOR */}
      <Button
        type="primary"
        onClick={() => {
          setModalVisibleAgregar(true);
          formAgregar.resetFields();
        }}
        style={{
          marginTop: "20px",
          backgroundColor: "#4CAF50",
          borderColor: "#45A049",
          color: "white"
        }}
      >
        ➕ Agregar Deudor
      </Button>

      <Card className="w-full max-w-6xl mt-6 bg-gray-800 text-white shadow-lg">
        <Table
          dataSource={deudores}
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
          MODAL - AGREGAR NUEVO DEUDOR
      ────────────────────────────────────────────────────────────── */}
      <Modal
        title="➕ Agregar Deudor"
        open={modalVisibleAgregar}
        onCancel={() => setModalVisibleAgregar(false)}
        footer={null}
      >
        <Form form={formAgregar} onFinish={handleAgregarDeudor} layout="vertical">
          <Form.Item
            name="nombre"
            label="Nombre del Deudor"
            rules={[{ required: true, message: "Ingrese el nombre del deudor" }]}
          >
            <Input placeholder="Ej: Juan Pérez" />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Descripción de la Deuda"
            rules={[{ required: true, message: "Ingrese la descripción" }]}
          >
            <Input placeholder="Ej: 10 botes de pintura" />
          </Form.Item>
          <Form.Item
            name="cantidad"
            label="Monto de la Deuda"
            rules={[{ required: true, message: "Ingrese un monto" }]}
          >
            <Input type="number" min="1" step="1" placeholder="Ej: 200" />
          </Form.Item>
          <Form.Item
            name="comentario"
            label="Comentario (Opcional)"
          >
            <Input.TextArea placeholder="Ej: Pagará a fin de mes" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ backgroundColor: "#008000", borderColor: "#006400", color: "white" }}
          >
            Guardar
          </Button>
        </Form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────
          MODAL - EDITAR DEUDA EXISTENTE
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
            <Input type="number" min="1" step="1" placeholder="Ej: 300" />
          </Form.Item>
          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "Ingrese una descripción" }]}
          >
            <Input placeholder="Ej: 5 sacos de cemento" />
          </Form.Item>
          <Form.Item
            name="comentario"
            label="Comentario"
            rules={[{ required: true, message: "Ingrese un comentario" }]}
          >
            <Input.TextArea placeholder="Ej: Deuda pendiente de la semana pasada" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ backgroundColor: "#008000", borderColor: "#006400", color: "white" }}
          >
            Guardar Cambios
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default ListaDeudores;
