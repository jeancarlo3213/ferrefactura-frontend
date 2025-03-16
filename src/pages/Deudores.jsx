import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Table, Button, message, Typography, Modal, Input, Form, Spin } from "antd";
import { Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api";
const { Title } = Typography;

function ListaDeudores() {
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [loadingAbono, setLoadingAbono] = useState(false);

  useEffect(() => {
    fetchDeudores();
  }, []);

  // 🔹 Obtener la lista de deudores
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

  // 🔹 Registrar un abono y actualizar la caja
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

      // 🔹 Obtener el último registro de caja (ordenado por fecha DESC)
      const cajaResponse = await axios.get(`${API_URL}/caja-diaria/`, { headers });
      if (cajaResponse.data.length === 0) {
        message.error("No hay registros de caja disponibles.");
        setLoadingAbono(false);
        return;
      }

      const ultimaCaja = cajaResponse.data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];

      // 🔹 Datos del abono
      const pagoData = {
        deudor: selectedDeudor.deudor,
        cantidad_pagada: cantidadAbonada,
        caja: ultimaCaja.id,
        comentario: values.comentario || `Abono de Q${cantidadAbonada} a la deuda de ${selectedDeudor.deudor_nombre}.`
      };

      // 🔹 Enviar el abono a la API
      await axios.post(`${API_URL}/pagos-deudas/`, pagoData, { headers });

      // 🔹 Actualizar la deuda del deudor
      const nuevaCantidadDeuda = cantidadDeuda - cantidadAbonada;
      await axios.patch(`${API_URL}/registros-deudas/${selectedDeudor.id}/`, { cantidad: nuevaCantidadDeuda }, { headers });

      // 🔹 Si la deuda llega a 0, marcar al deudor como "Pagado"
      if (nuevaCantidadDeuda === 0) {
        await axios.patch(`${API_URL}/deudores/${selectedDeudor.deudor}/`, { estado: "Pagado" }, { headers });
      }

      // 🔹 **Actualizar el último registro de caja**
      const nuevoComentario = `${ultimaCaja.comentario} - Pago de deuda del Sr. ${selectedDeudor.deudor_nombre} por Q${cantidadAbonada}`;
      
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
      setModalVisible(false);
      fetchDeudores();
    } catch (error) {
      message.error(error.response?.data?.message || "Error al registrar abono");
    }
    setLoadingAbono(false);
  };

  const columns = [
    { title: "Nombre", dataIndex: "deudor_nombre", key: "deudor_nombre" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad" },
    { title: "Estado", dataIndex: "estado", key: "estado", render: (text) => (
        <span style={{ color: text === "Pagado" ? "green" : "red", fontWeight: "bold" }}>{text}</span>
      ) 
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        record.estado !== "Pagado" && (
          <Button
            type="primary"
            style={{ backgroundColor: "#FF7F50", borderColor: "#FF4500", color: "white" }}
            onClick={() => {
              setSelectedDeudor(record);
              form.setFieldsValue({ deudor: record.deudor, cantidad_pagada: "" });
              setModalVisible(true);
            }}
          >
            💳 Abonar
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-blue-300">📝 Lista de Deudores</Title>
      <Link to="/administrador" className="text-blue-400 underline">⬅ Volver al Administrador</Link>

      <Card className="w-full max-w-6xl mt-6 bg-gray-800 text-white shadow-lg">
        <Table dataSource={deudores} columns={columns} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="💰 Abonar a la Deuda" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form form={form} onFinish={handleAbonarDeuda} layout="vertical">
          <Form.Item name="deudor" label="Deudor">
            <Input value={selectedDeudor?.deudor_nombre || ""} disabled />
          </Form.Item>
          <Form.Item name="cantidad_pagada" label="Cantidad a Abonar" rules={[{ required: true, message: "Ingrese un monto válido" }]}>
            <Input type="number" min="1" placeholder="Ej: 150" />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ backgroundColor: "#008000", borderColor: "#006400", color: "white" }} className="mt-2 w-full" disabled={loadingAbono}>
            {loadingAbono ? <Spin /> : "💾 Registrar Abono"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default ListaDeudores;
