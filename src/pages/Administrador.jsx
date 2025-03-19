import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Button, Modal, Input, Form, message } from "antd";
import { Link } from "react-router-dom";
import { FaUserPlus, FaBook, FaDollarSign, FaUserFriends, FaCheckCircle, FaPlusCircle } from "react-icons/fa";
const API_URL = import.meta.env.VITE_API_URL;


function Administrador() {
  const [caja, setCaja] = useState(null);
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [form] = Form.useForm();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      const [cajaRes, deudasRes] = await Promise.all([
        axios.get(`${API_URL}/caja-diaria/`, { headers }),
        axios.get(`${API_URL}/registros-deudas/`, { headers }),
      ]);

      setCaja(cajaRes.data.length ? cajaRes.data[cajaRes.data.length - 1] : null);
      setDeudas(deudasRes.data);
    
    } catch  {
      message.error("Error al cargar datos.");
    }
    setLoading(false);
  };

  const handleAddRegistro = async (values) => {
    setButtonDisabled(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      if (modalType === "caja") {
        await axios.post(`${API_URL}/caja-diaria/`, values, { headers });
        message.success("Registro agregado a caja diaria correctamente.");
      } else if (modalType === "deudor") {
        const deudorRes = await axios.post(`${API_URL}/deudores/`, { nombre: values.nombre }, { headers });
        const deudorId = deudorRes.data.id;

        await axios.post(
          `${API_URL}/registros-deudas/`,
          {
            deudor: deudorId,
            descripcion: values.descripcion,
            cantidad: values.cantidad,
            comentario: values.comentario || "Pago pendiente",
          },
          { headers }
        );

        message.success("Deudor registrado correctamente y deuda creada.");
      }

      setModalVisible(false);
      fetchData();
    } catch  {
      message.error("Ocurrió un error al procesar la solicitud.");
    }
    setButtonDisabled(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-blue-400">📊 Panel de Administración</h1>
      <p>Gestión de caja diaria, ingresos y pagos.</p>

      <div className="flex flex-wrap gap-4 mt-4">
        <Link to="/historial">
          <Button type="primary" icon={<FaBook />} style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}>
            Ver Historial
          </Button>
        </Link>
        <Link to="/caja-diaria">
          <Button type="primary" icon={<FaDollarSign />} style={{ backgroundColor: "#007BFF", borderColor: "#007BFF" }}>
            Ver Caja Diaria
          </Button>
        </Link>
        <Link to="/deudores">
          <Button type="primary" icon={<FaUserFriends />} style={{ backgroundColor: "#FFA500", borderColor: "#FFA500" }}>
            Ver Deudores
          </Button>
        </Link>
        <Button
          type="primary"
          icon={<FaUserPlus />}
          style={{ backgroundColor: "#DC143C", borderColor: "#DC143C" }}
          onClick={() => { setModalType("deudor"); setModalVisible(true); }}
        >
          Agregar Deudor
        </Button>
      </div>

      {loading ? <p>Cargando datos...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Card title="📌 Último Registro de Caja" className="bg-gray-800 text-white shadow-lg">
            {caja ? (
              <>
                <p><strong>Total en cuenta:</strong> Q{caja.cuenta_banco}</p>
                <p><strong>Efectivo:</strong> Q{caja.efectivo}</p>
                <p><strong>Gastos:</strong> Q{caja.gastos}</p>
                <p><strong>Total:</strong> Q{caja.total}</p>
                <p><strong>Comentario:</strong> {caja.comentario}</p>
                <Button
                  type="primary"
                  icon={<FaPlusCircle />}
                  style={{ backgroundColor: "#32CD32", borderColor: "#32CD32" }}
                  onClick={() => { setModalType("caja"); setModalVisible(true); }}
                >
                  Agregar Ingreso/Gasto
                </Button>
              </>
            ) : <p>No hay registros aún.</p>}
          </Card>

          <Card title="🧾 Deudas Pendientes" className="bg-gray-800 text-white shadow-lg">
            {deudas.length > 0 ? (
              deudas.map((deuda) => (
                <p key={deuda.id}>
                  <strong>{deuda.deudor_nombre}</strong> - Q{deuda.cantidad} ({deuda.descripcion})
                </p>
              ))
            ) : <p>No hay deudas registradas.</p>}
          </Card>
        </div>
      )}

      <Modal
        title={modalType === "caja" ? "Agregar Ingreso/Gasto" : "Registrar Deudor"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddRegistro} layout="vertical">
          {modalType === "deudor" && (
            <>
              <Form.Item name="nombre" label="Nombre del Deudor" rules={[{ required: true }]}>
                <Input placeholder="Ej: Juan Pérez" />
              </Form.Item>
              <Form.Item name="descripcion" label="Descripción de la Deuda" rules={[{ required: true }]}>
                <Input placeholder="Ej: Compra de una pala" />
              </Form.Item>
              <Form.Item name="cantidad" label="Monto de la Deuda" rules={[{ required: true }]}>
                <Input type="number" min="1" placeholder="Ej: 200" />
              </Form.Item>
              <Form.Item name="comentario" label="Comentario (Opcional)">
                <Input.TextArea placeholder="Ej: Pago pendiente" />
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" icon={<FaCheckCircle />} disabled={buttonDisabled}>
            Guardar
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default Administrador;
