import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Button, Table, Modal, Form, Input, message, Typography, Select } from "antd";
import { FaDollarSign, FaSyncAlt } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

const { Title } = Typography;
const { Option } = Select;

function GestionCajaDiaria() {
  const [caja, setCaja] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRegistro1, setSelectedRegistro1] = useState(null);
  const [selectedRegistro2, setSelectedRegistro2] = useState(null);
  const [diferencia, setDiferencia] = useState(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    fetchCaja();
  }, []);

  const fetchCaja = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const response = await axios.get(`${API_URL}/caja-diaria/`, { headers });
      setCaja(response.data);
    } catch (error) {
      message.error(`Error al cargar datos: ${error.response?.data?.message || error.message}`);
    }
    setLoading(false);
  };

  const handleAddRegistro = async (values) => {
    setButtonDisabled(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const data = {
        cuenta_banco: values.cuenta_banco ?? 0,
        efectivo: values.efectivo ?? 0,
        sencillo: values.sencillo ?? 0,
        gastos: values.gastos ?? 0,
        ingreso_extra: values.ingreso_extra ?? 0,
        comentario: values.comentario || "Sin comentario"
      };

      await axios.post(`${API_URL}/caja-diaria/`, data, { headers });
      message.success("Registro agregado a caja diaria");
      setModalVisible(false);
      fetchCaja();
    } catch (error) {
      message.error(`Error: ${error.response?.data?.message || "No se pudo registrar el ingreso"}`);
    }
    setButtonDisabled(false);
  };

  const handleCompararRegistros = () => {
    if (!selectedRegistro1 || !selectedRegistro2) {
      message.warning("Selecciona dos registros para comparar");
      return;
    }
    setDiferencia({
      cuenta_banco: selectedRegistro2.cuenta_banco - selectedRegistro1.cuenta_banco,
      efectivo: selectedRegistro2.efectivo - selectedRegistro1.efectivo,
      gastos: selectedRegistro2.gastos - selectedRegistro1.gastos,
      total: selectedRegistro2.total - selectedRegistro1.total,
      total_sin_deuda: selectedRegistro2.total_sin_deuda - selectedRegistro1.total_sin_deuda,
      total_con_deuda: selectedRegistro2.total_con_deuda - selectedRegistro1.total_con_deuda
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Fecha", dataIndex: "fecha_creacion", key: "fecha_creacion" },
    { title: "Banco", dataIndex: "cuenta_banco", key: "cuenta_banco" },
    { title: "Efectivo", dataIndex: "efectivo", key: "efectivo" },
    { title: "Sencillo", dataIndex: "sencillo", key: "sencillo" },
    { title: "Gastos", dataIndex: "gastos", key: "gastos" },
    { title: "Ingreso Extra", dataIndex: "ingreso_extra", key: "ingreso_extra" },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "Total sin Deuda", dataIndex: "total_sin_deuda", key: "total_sin_deuda" },
    { title: "Total con Deuda", dataIndex: "total_con_deuda", key: "total_con_deuda" },
    { title: "Comentario", dataIndex: "comentario", key: "comentario" }
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <Title level={2} className="text-blue-300"><FaDollarSign /> Gestión de Caja Diaria</Title>
      <Card className="w-full max-w-6xl mt-6 bg-gray-800 text-white shadow-lg">
        <Button type="primary" disabled={buttonDisabled} onClick={() => setModalVisible(true)}>
          ➕ Agregar Registro
        </Button>

        <div className="flex gap-4 mt-4">
          <Select placeholder="Registro 1" onChange={(id) => setSelectedRegistro1(caja.find(c => c.id === id))}>
            {caja.map(c => (<Option key={c.id} value={c.id}>{c.fecha_creacion}</Option>))}
          </Select>
          <Select placeholder="Registro 2" onChange={(id) => setSelectedRegistro2(caja.find(c => c.id === id))}>
            {caja.map(c => (<Option key={c.id} value={c.id}>{c.fecha_creacion}</Option>))}
          </Select>
          <Button type="primary" onClick={handleCompararRegistros}><FaSyncAlt /> Comparar</Button>
        </div>

        {diferencia && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <p><strong>Total:</strong> {diferencia.total}</p>
            <p><strong>Total sin Deuda:</strong> {diferencia.total_sin_deuda}</p>
            <p><strong>Total con Deuda:</strong> {diferencia.total_con_deuda}</p>
          </div>
        )}

        <Table dataSource={caja} columns={columns} loading={loading} rowKey="id" className="mt-4" />
      </Card>

      <Modal title="Agregar Ingreso/Gasto" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form form={form} onFinish={handleAddRegistro} layout="vertical">
          <Form.Item name="cuenta_banco" label="Cuenta Banco" rules={[{ required: true, message: "Requerido" }]}>
            <Input type="number" min="0" />
          </Form.Item>
          <Form.Item name="efectivo" label="Efectivo" rules={[{ required: true, message: "Requerido" }]}>
            <Input type="number" min="0" />
          </Form.Item>
          <Form.Item name="sencillo" label="Sencillo">
            <Input type="number" min="0" />
          </Form.Item>
          <Form.Item name="gastos" label="Gastos">
            <Input type="number" min="0" />
          </Form.Item>
          <Form.Item name="ingreso_extra" label="Ingreso Extra">
            <Input type="number" min="0" />
          </Form.Item>
          <Form.Item name="comentario" label="Comentario">
            <Input.TextArea placeholder="Opcional" />
          </Form.Item>
          <Button type="primary" htmlType="submit" disabled={buttonDisabled}>Guardar</Button>
        </Form>
      </Modal>
    </div>
  );
}

export default GestionCajaDiaria;
