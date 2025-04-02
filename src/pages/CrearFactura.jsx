import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Steps,
  message,
  Modal,
  Form,
  InputNumber,
} from "antd";
import { FaPlus, FaCheckCircle, FaTrash } from "react-icons/fa";
import "../styles/facturas.css";

const API_URL = import.meta.env.VITE_API_URL;
const { Step } = Steps;

function CrearFactura() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentStep, setCurrentStep] = useState(0);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [totalFactura, setTotalFactura] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`${API_URL}/productos/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const procesados = data.map((p) => ({
          ...p,
          precio: parseFloat(p.precio),
          precio_quintal: p.precio_quintal ? parseFloat(p.precio_quintal) : null,
          descuentoPorUnidad: 0,
        }));
        setProductos(procesados);
      });
  }, [token]);

  const calcularTotal = useCallback(() => {
    const total = productosSeleccionados.reduce((acc, p) => {
      const totalQ = (p.precio_quintal || 0) * p.cantidadQuintales;
      const totalU = p.precio * p.cantidadUnidades;
      const descuento = p.descuentoPorUnidad * p.cantidadUnidades;
      return acc + totalQ + totalU - descuento;
    }, 0);

    setTotalFactura(total + Number(costoEnvio || 0) - Number(descuentoTotal || 0));
  }, [productosSeleccionados, costoEnvio, descuentoTotal]);

  useEffect(() => {
    calcularTotal();
  }, [productosSeleccionados, costoEnvio, descuentoTotal, calcularTotal]);

  const agregarProducto = (p) => {
    if (p.stock <= 0) return message.warning("Sin stock disponible");
    if (productosSeleccionados.find((prod) => prod.id === p.id)) {
      return message.info("Este producto ya está en la lista");
    }
    setProductosSeleccionados((prev) => [
      ...prev,
      { ...p, cantidadQuintales: 0, cantidadUnidades: 0 },
    ]);
    message.success("Producto agregado");
  };

  const quitarProducto = (id) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));
  };

  const modificarCantidad = (id, campo, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nuevoValor = parseFloat(valor) || 0;

        const unPorQ = p.unidades_por_quintal || 1;
        const totalUnidades =
          (campo === "cantidadQuintales" ? nuevoValor : p.cantidadQuintales) *
            unPorQ +
          (campo === "cantidadUnidades" ? nuevoValor : p.cantidadUnidades);

        if (totalUnidades > p.stock) {
          message.warning("Excede el stock disponible");
          return p;
        }

        if (
          campo === "cantidadUnidades" &&
          p.precio_quintal &&
          p.unidades_por_quintal &&
          nuevoValor >= p.unidades_por_quintal
        ) {
          message.warning("Usa un quintal en lugar de tantas unidades");
          return p;
        }

        return { ...p, [campo]: nuevoValor };
      })
    );
  };

  const confirmarFactura = async () => {
    if (!nombreCliente.trim()) return message.error("Nombre del cliente requerido");
    if (!fechaEntrega) return message.error("Fecha de entrega requerida");
    if (productosSeleccionados.length === 0)
      return message.error("Debes agregar al menos un producto");

    const payload = {
      nombre_cliente: nombreCliente,
      fecha_entrega: fechaEntrega,
      costo_envio: costoEnvio,
      descuento_total: descuentoTotal,
      usuario_id: 1,
      productos: [],
    };

    productosSeleccionados.forEach((p) => {
      if (p.cantidadQuintales > 0) {
        payload.productos.push({
          producto_id: p.id,
          cantidad: p.cantidadQuintales,
          precio_unitario: p.precio_quintal,
        });
      }
      if (p.cantidadUnidades > 0) {
        payload.productos.push({
          producto_id: p.id,
          cantidad: p.cantidadUnidades,
          precio_unitario: p.precio,
        });
      }
    });

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/facturas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar factura");
      const data = await res.json();
      message.success("Factura creada");
      navigate(`/verfactura/${data.id}`);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pasos = [
    {
      title: "Cliente",
      content: (
        <div className="flex justify-center gap-6 animate-fade-in">
          <div className="flex flex-col items-start">
            <label className="font-bold mb-1">Nombre del Cliente</label>
            <Input
              className="rounded-xl w-64"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="font-bold mb-1">Fecha de Entrega</label>
            <Input
              type="date"
              className="rounded-xl w-64"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Productos",
      content: (
        <div className="animate-fade-in">
          <div className="flex justify-center gap-4 mb-4">
            <Input
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="productos-search"
            />
            <Button onClick={() => setModalVisible(true)}>+ Nuevo Producto</Button>
          </div>
          <div className="space-y-4">
            {productos
              .filter((p) =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase())
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-4 rounded-xl bg-gray-800 shadow-lg hover:scale-[1.01] transition-transform"
                >
                  <div>
                    <p className="font-bold">{p.nombre}</p>
                    <p>Q{p.precio} unidad</p>
                    {p.precio_quintal && <p>Q{p.precio_quintal} por quintal</p>}
                    <p>Stock: {p.stock}</p>
                  </div>
                  <Button
                    icon={<FaPlus />}
                    className="btn-agregar"
                    onClick={() => agregarProducto(p)}
                  >
                    Agregar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ),
    },
    {
      title: "Resumen",
      content: (
        <div className="space-y-6 animate-fade-in">
          {productosSeleccionados.map((p) => {
            const total =
              (p.precio_quintal || 0) * p.cantidadQuintales +
              p.precio * p.cantidadUnidades -
              (p.descuentoPorUnidad || 0) * p.cantidadUnidades;

            return (
              <div
                key={p.id}
                className="p-4 bg-gray-800 rounded-xl shadow-md space-y-2"
              >
                <h3 className="text-lg font-bold text-center">{p.nombre}</h3>
                <div className="flex justify-center gap-4">
                  {p.precio_quintal && (
                    <div>
                      <label className="block text-sm mb-1">
                        Cantidad x Quintal
                      </label>
                      <Input
                        type="number"
                        className="!w-28"
                        value={p.cantidadQuintales}
                        onChange={(e) =>
                          modificarCantidad(p.id, "cantidadQuintales", e.target.value)
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm mb-1">
                      Cantidad x Unidad
                    </label>
                    <Input
                      type="number"
                      className="!w-28"
                      value={p.cantidadUnidades}
                      onChange={(e) =>
                        modificarCantidad(p.id, "cantidadUnidades", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    icon={<FaTrash />}
                    danger
                    onClick={() => quitarProducto(p.id)}
                    className="self-end"
                  />
                </div>
                <p className="text-center font-medium">Total: Q{total.toFixed(2)}</p>
              </div>
            );
          })}

          <div className="flex justify-center gap-6">
            <div>
              <label className="font-semibold">Descuento Total (Q)</label>
              <Input
                type="number"
                value={descuentoTotal}
                onChange={(e) => setDescuentoTotal(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="font-semibold">Costo de Envío (Q)</label>
              <Input
                type="number"
                value={costoEnvio}
                onChange={(e) => setCostoEnvio(Number(e.target.value))}
              />
            </div>
          </div>

          <h2 className="text-center text-xl font-bold mt-4">
            Total: Q{totalFactura.toFixed(2)}
          </h2>
        </div>
      ),
    },
  ];

  return (
    <div className="productos-container">
      <div className="logo-wrapper">
        <img src="/Logo.jpeg" alt="Logo" className="logo-hero" />
      </div>

      <Steps
        current={currentStep}
        items={pasos.map((p) => ({ title: p.title }))}
        className="mb-6"
      />

      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full">
        {pasos[currentStep].content}
      </div>

      <div className="flex justify-between mt-6 w-full">
        {currentStep > 0 && (
          <Button onClick={() => setCurrentStep(currentStep - 1)}>Regresar</Button>
        )}
        {currentStep < pasos.length - 1 ? (
          <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<FaCheckCircle />}
            loading={submitting}
            onClick={confirmarFactura}
          >
            Confirmar
          </Button>
        )}
      </div>

      <Modal
        title="Agregar Nuevo Producto"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => {
          form.validateFields().then(async (values) => {
            const res = await fetch(`${API_URL}/productos/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
              body: JSON.stringify(values),
            });
            const nuevo = await res.json();
            setProductos((prev) => [...prev, nuevo]);
            form.resetFields();
            setModalVisible(false);
            message.success("Producto creado");
          });
        }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="precio"
            label="Precio por unidad"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="precio_quintal" label="Precio por quintal">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="unidades_por_quintal" label="Unidades por quintal">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CrearFactura;
