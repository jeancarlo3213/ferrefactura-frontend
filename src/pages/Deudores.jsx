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
  InputNumber,
  Select,
  List,
} from "antd";
import { FaPlus, FaTrash } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;
const { Title } = Typography;
const { Option } = Select;

function Deudores() {
  // Estados generales
  const [deudores, setDeudores] = useState([]);
  const [deudoresApi, setDeudoresApi] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAbono, setLoadingAbono] = useState(false);

  // Estados para búsqueda de productos en el modal
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalExistente, setModalExistente] = useState(false);
  const [modalAbonar, setModalAbonar] = useState(false);
  const [modalPagos, setModalPagos] = useState(false);

  // Estado para el deudor seleccionado (para deuda existente y abonos)
  const [deudorSeleccionado, setDeudorSeleccionado] = useState(null);
  // Historial de pagos del deudor
  const [pagosCliente, setPagosCliente] = useState([]);

  // Formularios
  const [formNuevo] = Form.useForm();
  const [formExistente] = Form.useForm();
  const [formAbonar] = Form.useForm();

  // Se carga la data inicial
  useEffect(() => {
    fetchDeudores();
    fetchDeudoresApi();
    fetchProductos();
  }, []);

  // Cada vez que se actualizan los productos seleccionados se calcula el total sugerido
  useEffect(() => {
    const total = productosSeleccionados.reduce((acc, p) => {
      const totalQuintal = (p.precio_quintal || 0) * (p.cantidadQuintales || 0);
      const totalUnidad = (p.precio || 0) * (p.cantidadUnidades || 0);
      return acc + totalQuintal + totalUnidad;
    }, 0);
    // Actualiza el valor en ambos formularios (pero se puede modificar manualmente)
    formNuevo.setFieldsValue({ cantidad: total });
    formExistente.setFieldsValue({ cantidad: total });
  }, [productosSeleccionados, formNuevo, formExistente]);

  // Función para traer los registros de deudas
  const fetchDeudores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/registros-deudas/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setDeudores(res.data);
    } catch {
      message.error("Error al obtener las deudas");
    }
    setLoading(false);
  };

  // Función para traer la data de deudores de la otra API
  const fetchDeudoresApi = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/deudores/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setDeudoresApi(res.data);
    } catch {
      setDeudoresApi([]);
    }
  };

  // Trae los productos disponibles
  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/productos/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setProductos(res.data);
    } catch {
      setProductos([]);
    }
  };

  // Agrega un producto a la lista (evita duplicados)
  const agregarProducto = (producto) => {
    if (productosSeleccionados.find((p) => p.id === producto.id)) return;
    setProductosSeleccionados((prev) => [
      ...prev,
      { ...producto, cantidadQuintales: 0, cantidadUnidades: 0 },
    ]);
  };

  // Actualiza la cantidad en la lista de productos seleccionados
  const actualizarCantidad = (id, campo, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, [campo]: Number(valor) } : p
      )
    );
  };

  // Elimina un producto de la selección
  const eliminarProducto = (id) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.id !== id)
    );
  };

  // Arma la descripción de la deuda (con fecha y detalle de productos y cantidades)
  const calcularDescripcion = () => {
    const fecha = new Date().toLocaleDateString();
    const lista = productosSeleccionados.map((p) => {
      const partes = [];
      if (p.cantidadQuintales > 0) partes.push(`${p.nombre} x${p.cantidadQuintales} qq`);
      if (p.cantidadUnidades > 0) partes.push(`${p.nombre} x${p.cantidadUnidades} u`);
      return partes.join(" + ");
    });
    return `📅 ${fecha} - ${lista.join(", ")}`;
  };

  // Registra un nuevo deudor y la deuda correspondiente
  const registrarNuevoDeudor = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      // Crear deudor
      const nuevo = await axios.post(
        `${API_URL}/deudores/`,
        { nombre: values.nombre },
        { headers }
      );
      const deudorId = nuevo.data.id;

      // Registrar la deuda con la descripción generada y el monto (editable)
      await axios.post(
        `${API_URL}/registros-deudas/`,
        {
          deudor: deudorId,
          descripcion: calcularDescripcion(),
          cantidad: values.cantidad,
          comentario: values.comentario || "Pendiente",
        },
        { headers }
      );

      message.success("Deudor y deuda registrados correctamente");
      formNuevo.resetFields();
      setProductosSeleccionados([]);
      setModalNuevo(false);
      fetchDeudores();
      fetchDeudoresApi();
    } catch {
      message.error("Error al registrar nuevo deudor");
    }
  };

  // Registra deuda a un deudor existente
  const registrarDeudaExistente = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const total = values.cantidad; // monto editable
      const descripcionNueva = calcularDescripcion();
      // Busca si el deudor ya tiene una deuda activa
      const deudas = deudores.filter((d) => d.deudor === deudorSeleccionado);
      const activa = deudas.find(
        (d) => d.comentario !== "PAGADO" && parseFloat(d.cantidad) > 0
      );

      if (activa) {
        // Actualiza la deuda actual concatenando la nueva descripción y sumando el monto
        await axios.patch(
          `${API_URL}/registros-deudas/${activa.id}/`,
          {
            descripcion: `${activa.descripcion}\n${descripcionNueva}`,
            cantidad: parseFloat(activa.cantidad) + total,
          },
          { headers }
        );
      } else {
        // O crea un nuevo registro de deuda
        await axios.post(
          `${API_URL}/registros-deudas/`,
          {
            deudor: deudorSeleccionado,
            descripcion: descripcionNueva,
            cantidad: total,
            comentario: values.comentario || "Pendiente",
          },
          { headers }
        );
      }

      message.success("Deuda agregada al deudor existente");
      formExistente.resetFields();
      setProductosSeleccionados([]);
      setModalExistente(false);
      fetchDeudores();
    } catch {
      message.error("Error al agregar deuda al deudor");
    }
  };

  // Realiza un abono a la deuda del deudor seleccionado
  const abonarDeuda = async (values) => {
    setLoadingAbono(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };
      const abono = parseFloat(values.cantidad_pagada);
      const actual = parseFloat(deudorSeleccionado.cantidad);
      const nueva = actual - abono;

      await axios.patch(
        `${API_URL}/registros-deudas/${deudorSeleccionado.id}/`,
        {
          cantidad: nueva,
          comentario: nueva <= 0 ? "PAGADO" : deudorSeleccionado.comentario,
        },
        { headers }
      );

      if (nueva <= 0) {
        await axios.patch(
          `${API_URL}/deudores/${deudorSeleccionado.deudor}/`,
          { estado: "Pagado" },
          { headers }
        );
      }

      const caja = await axios.get(`${API_URL}/caja-diaria/`, { headers });
      const cajaId = caja.data.at(-1)?.id;
      await axios.post(
        `${API_URL}/pagos-deudas/`,
        {
          deudor: deudorSeleccionado.deudor,
          cantidad_pagada: abono,
          comentario: values.comentario || `Abono de Q${abono}`,
          caja: cajaId,
        },
        { headers }
      );

      message.success("Abono registrado con éxito");
      setModalAbonar(false);
      fetchDeudores();
    } catch {
      message.error("Error al abonar la deuda");
    }
    setLoadingAbono(false);
  };

  // Trae y muestra el historial de pagos para el deudor
  const verPagos = async (deudorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/pagos-deudas/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const pagos = res.data.filter((p) => p.deudor === deudorId);
      setPagosCliente(pagos);
      setModalPagos(true);
    } catch {
      message.error("Error al traer los pagos");
    }
  };

  // Filtra los productos según la búsqueda en el modal
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Title level={2}>📋 Lista de Deudores</Title>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar deudor..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          onClick={() => {
            setModalNuevo(true);
            setProductosSeleccionados([]);
          }}
        >
          ➕ Nuevo Deudor
        </Button>
        <Button
          onClick={() => {
            setModalExistente(true);
            setProductosSeleccionados([]);
          }}
        >
          ➕ A Deudor Existente
        </Button>
      </div>

      <Card>
        <Table
          dataSource={deudores.filter((d) =>
            d.deudor_nombre?.toLowerCase().includes(searchText.toLowerCase())
          )}
          columns={[
            { title: "Nombre", dataIndex: "deudor_nombre" },
            { title: "Descripción", dataIndex: "descripcion" },
            { title: "Cantidad", dataIndex: "cantidad" },
            {
              title: "Comentario",
              dataIndex: "comentario",
              render: (text) => (
                <span style={{ color: text === "PAGADO" ? "green" : "white" }}>
                  {text}
                </span>
              ),
            },
            {
              title: "Acciones",
              render: (_, record) => (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setDeudorSeleccionado(record);
                      formAbonar.resetFields();
                      setModalAbonar(true);
                    }}
                  >
                    💳 Abonar
                  </Button>
                  <Button onClick={() => verPagos(record.deudor)}>
                    📜 Ver Pagos
                  </Button>
                </div>
              ),
            },
          ]}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal: Nuevo Deudor */}
      <Modal
        title="Nuevo Deudor y Deuda"
        open={modalNuevo}
        onCancel={() => setModalNuevo(false)}
        footer={null}
      >
        <Form form={formNuevo} onFinish={registrarNuevoDeudor} layout="vertical">
          <Form.Item
            name="nombre"
            label="Nombre del Deudor"
            rules={[{ required: true, message: "Este campo es requerido" }]}
          >
            <Input placeholder="Nombre completo" />
          </Form.Item>
          <Form.Item name="comentario" label="Comentario (opcional)">
            <Input.TextArea placeholder="Ej: Fiado de productos varios" />
          </Form.Item>
          <Form.Item name="cantidad" label="Total sugerido">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Title level={5}>Buscar productos</Title>
          <Input
            placeholder="Buscar producto..."
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
          />
          <List
            size="small"
            dataSource={productosFiltrados}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    onClick={() => agregarProducto(item)}
                    icon={<FaPlus />}
                  />,
                ]}
                style={{ padding: "4px 0" }}
              >
                {item.nombre} - Q{item.precio}{" "}
                {item.precio_quintal && `(Q${item.precio_quintal} / qq)`}
              </List.Item>
            )}
            style={{ maxHeight: 150, overflowY: "auto", marginBottom: 10 }}
          />
          {productosSeleccionados.length > 0 && (
            <div>
              <Title level={5}>Productos Seleccionados</Title>
              {productosSeleccionados.map((p) => (
                <div key={p.id} style={{ marginBottom: 5 }}>
                  <span>
                    {p.nombre}:
                    {p.precio_quintal && (
                      <>
                        {" "}
                        Quintales:{" "}
                        <InputNumber
                          min={0}
                          value={p.cantidadQuintales}
                          onChange={(val) =>
                            actualizarCantidad(p.id, "cantidadQuintales", val)
                          }
                          style={{ marginRight: 5 }}
                        />
                      </>
                    )}
                    {"  Unidades: "}
                    <InputNumber
                      min={0}
                      value={p.cantidadUnidades}
                      onChange={(val) =>
                        actualizarCantidad(p.id, "cantidadUnidades", val)
                      }
                    />
                  </span>
                  <Button
                    type="link"
                    onClick={() => eliminarProducto(p.id)}
                    icon={<FaTrash />}
                  />
                </div>
              ))}
            </div>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Registrar Nuevo Deudor
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Deudor Existente */}
      <Modal
        title="Agregar deuda a Deudor Existente"
        open={modalExistente}
        onCancel={() => setModalExistente(false)}
        footer={null}
      >
        <Form form={formExistente} onFinish={registrarDeudaExistente} layout="vertical">
          <Form.Item
            name="deudor"
            label="Seleccionar deudor"
            rules={[{ required: true, message: "Selecciona un deudor" }]}
          >
            <Select
              showSearch
              placeholder="Buscar deudor..."
              optionFilterProp="children"
              onChange={(value) => setDeudorSeleccionado(value)}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {deudoresApi.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.nombre} {d.estado && `(${d.estado})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="comentario" label="Comentario (opcional)">
            <Input.TextArea placeholder="Comentario adicional" />
          </Form.Item>
          <Form.Item name="cantidad" label="Total sugerido">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Input
            placeholder="Buscar producto..."
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
          />
          <List
            size="small"
            dataSource={productosFiltrados}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    onClick={() => agregarProducto(item)}
                    icon={<FaPlus />}
                  />,
                ]}
                style={{ padding: "4px 0" }}
              >
                {item.nombre} - Q{item.precio}{" "}
                {item.precio_quintal && `(Q${item.precio_quintal} / qq)`}
              </List.Item>
            )}
            style={{ maxHeight: 150, overflowY: "auto", marginBottom: 10 }}
          />
          {productosSeleccionados.length > 0 && (
            <div>
              <Title level={5}>Productos Seleccionados</Title>
              {productosSeleccionados.map((p) => (
                <div key={p.id} style={{ marginBottom: 5 }}>
                  <span>
                    {p.nombre}:
                    {p.precio_quintal && (
                      <>
                        {" "}
                        Quintales:{" "}
                        <InputNumber
                          min={0}
                          value={p.cantidadQuintales}
                          onChange={(val) =>
                            actualizarCantidad(p.id, "cantidadQuintales", val)
                          }
                          style={{ marginRight: 5 }}
                        />
                      </>
                    )}
                    {"  Unidades: "}
                    <InputNumber
                      min={0}
                      value={p.cantidadUnidades}
                      onChange={(val) =>
                        actualizarCantidad(p.id, "cantidadUnidades", val)
                      }
                    />
                  </span>
                  <Button
                    type="link"
                    onClick={() => eliminarProducto(p.id)}
                    icon={<FaTrash />}
                  />
                </div>
              ))}
            </div>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Registrar Deuda
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Abonar Deuda */}
      <Modal
        title="Abonar deuda"
        open={modalAbonar}
        onCancel={() => setModalAbonar(false)}
        footer={null}
      >
        <Form form={formAbonar} onFinish={abonarDeuda} layout="vertical">
          <Form.Item
            name="cantidad_pagada"
            label="Monto a abonar"
            rules={[{ required: true, message: "Ingrese un monto" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="comentario" label="Comentario (opcional)">
            <Input.TextArea placeholder="Ej: Abono parcial" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loadingAbono}>
              Abonar
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Historial de Pagos */}
      <Modal
        title="Historial de Pagos"
        open={modalPagos}
        onCancel={() => setModalPagos(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalPagos(false)}>
            Cerrar
          </Button>,
        ]}
      >
        {pagosCliente.length === 0 ? (
          <p>No se han realizado pagos.</p>
        ) : (
          <List
            dataSource={pagosCliente}
            renderItem={(pago) => (
              <List.Item>
                <div>
                  <strong>Fecha:</strong> {new Date(pago.fecha_pago).toLocaleString()} -{" "}
                  <strong>Monto:</strong> Q{pago.cantidad_pagada} -{" "}
                  <strong>Comentario:</strong> {pago.comentario}
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
}

export default Deudores;
