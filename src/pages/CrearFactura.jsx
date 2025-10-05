import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Steps,
  message,
  Modal,
  Form,
  InputNumber,
  Tag,
  Empty,
  Alert,
} from "antd";
import { FaPlus, FaTrash, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import "../styles/crearfactura.css";

const { Step } = Steps;
const API_URL = import.meta.env.VITE_API_URL;

// formato Q
const fmtQ = (n) =>
  `Q${(Number(n) || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const totalUnits = (p) =>
  (p.cantidadQuintales || 0) * (p.unidades_por_quintal || 1) +
  (p.cantidadUnidades || 0);

export default function CrearFactura() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Paso (0: datos, 1: productos, 2: confirmar)
  const [step, setStep] = useState(0);

  // Datos
  const [nombreCliente, setNombreCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");

  // Productos
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Totales
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Nuevo producto
  const [nuevoModal, setNuevoModal] = useState(false);
  const [nuevoForm] = Form.useForm();

  // Cantidades al agregar
  const [cantModal, setCantModal] = useState(false);
  const [cantForm] = Form.useForm();
  const [productoTemp, setProductoTemp] = useState(null);

  // Modal para completar campos requeridos al confirmar
  const [reqOpen, setReqOpen] = useState(false);
  const [reqForm] = Form.useForm();

  // Cargar catálogo
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/productos/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await res.json();
        const parsed = (Array.isArray(data) ? data : []).map((p) => ({
          ...p,
          precio: parseFloat(p.precio) || 0,
          precio_quintal: p.precio_quintal ? parseFloat(p.precio_quintal) : null,
          unidades_por_quintal: p.unidades_por_quintal || 0,
        }));
        setProductos(parsed);
      } catch {
        message.error("No se pudieron cargar los productos");
      }
    })();
  }, [token]);

  // Filtro
  const catalogoFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => (p.nombre || "").toLowerCase().includes(q));
  }, [productos, busqueda]);

  // Agregar producto (abre modal de cantidad)
  const abrirAgregar = (p) => {
    if (productosSeleccionados.find((x) => x.id === p.id)) {
      message.info("Este producto ya está en el carrito.");
      return;
    }
    if ((p.stock || 0) <= 0) {
      message.warning("Sin stock disponible");
      return;
    }
    setProductoTemp(p);
    setCantModal(true);
    cantForm.resetFields();
  };

  const confirmarAgregar = (vals) => {
    const cantQ = Number(vals.cantidadQuintales) || 0;
    const cantU = Number(vals.cantidadUnidades) || 0;
    const p = productoTemp;
    const unxQ = p.unidades_por_quintal || 1;
    const total = cantQ * unxQ + cantU;

    if (total <= 0) return message.warning("Ingresa una cantidad válida");
    if (total > (p.stock || 0))
      return message.warning("Excede el stock disponible");

    setProductosSeleccionados((prev) => [
      ...prev,
      { ...p, cantidadQuintales: cantQ, cantidadUnidades: cantU },
    ]);
    setCantModal(false);
  };

  const setCantidad = (id, campo, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, [campo]: Number(valor) || 0 };
        if (totalUnits(next) > (p.stock || 0)) {
          message.warning("Excede el stock disponible");
          return p;
        }
        return next;
      }),
    );
  };

  const quitar = (id) =>
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));

  const subTotal = useMemo(
    () =>
      productosSeleccionados.reduce((acc, p) => {
        const tq = (p.precio_quintal || 0) * (p.cantidadQuintales || 0);
        const tu = (p.precio || 0) * (p.cantidadUnidades || 0);
        return acc + tq + tu;
      }, 0),
    [productosSeleccionados],
  );
  const total = useMemo(
    () => subTotal + (Number(costoEnvio) || 0) - (Number(descuentoTotal) || 0),
    [subTotal, costoEnvio, descuentoTotal],
  );

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // ---- envío real (sin validaciones aquí) ----
  const submitNow = useCallback(async () => {
    const payload = {
      nombre_cliente: nombreCliente,
      fecha_entrega: fechaEntrega,
      costo_envio: Number(costoEnvio) || 0,
      descuento_total: Number(descuentoTotal) || 0,
      usuario_id: 1,
      productos: [],
    };

    productosSeleccionados.forEach((p) => {
      if ((p.cantidadQuintales || 0) > 0) {
        payload.productos.push({
          producto_id: p.id,
          cantidad: p.cantidadQuintales,
          precio_unitario: p.precio_quintal,
        });
      }
      if ((p.cantidadUnidades || 0) > 0) {
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
      if (!res.ok) throw new Error("Error al guardar la factura");
      const data = await res.json();

      // actualizar stock
      for (const p of productosSeleccionados) {
        const purchased =
          (p.cantidadQuintales || 0) * (p.unidades_por_quintal || 1) +
          (p.cantidadUnidades || 0);
        const newStock = (p.stock || 0) - purchased;
        const u = await fetch(`${API_URL}/productos/${p.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ stock: newStock }),
        });
        if (!u.ok) throw new Error(`No se pudo actualizar stock de ${p.nombre}`);
      }

      message.success("Factura creada");
      navigate(`/verfactura/${data.id}`);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [
    nombreCliente,
    fechaEntrega,
    costoEnvio,
    descuentoTotal,
    productosSeleccionados,
    token,
    navigate,
  ]);

  // ---- confirmar con validaciones amables ----
  const confirmarFactura = useCallback(() => {
    if (productosSeleccionados.length === 0) {
      message.error("Agrega al menos un producto");
      setStep(1);
      return;
    }

    const missing = [];
    if (!nombreCliente.trim()) missing.push("nombre_cliente");
    if (!fechaEntrega) missing.push("fecha_entrega");

    if (missing.length) {
      // abrir modal para completar AQUÍ MISMO y luego enviar
      setReqOpen(true);
      reqForm.setFieldsValue({
        nombre_cliente: nombreCliente,
        fecha_entrega: fechaEntrega,
      });
      return;
    }
    // todo completo → enviar
    submitNow();
  }, [
    productosSeleccionados.length,
    nombreCliente,
    fechaEntrega,
    reqForm,
    submitNow,
  ]);

  // Salir con confirmación
  const confirmarSalir = () => {
    if (
      !productosSeleccionados.length &&
      !nombreCliente &&
      !fechaEntrega &&
      !costoEnvio &&
      !descuentoTotal
    ) {
      navigate("/facturas");
      return;
    }
    Modal.confirm({
      title: "¿Salir sin guardar?",
      content:
        "Perderás la factura en curso (productos y datos). ¿Quieres salir?",
      okText: "Sí, salir",
      cancelText: "Seguir aquí",
      okButtonProps: { danger: true },
      onOk: () => navigate("/facturas"),
    });
  };

  const items = [
    { title: "Datos" },
    { title: "Productos" },
    { title: "Confirmar" },
  ];

  return (
    <div className="crearfactura">
      <Steps current={step} onChange={(s) => setStep(s)} items={items} />

      <div className="step-card">
        {step === 0 && (
          <div className="animate-fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold mb-1 block">Nombre del cliente</label>
                <Input
                  placeholder="Escribe el nombre…"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold mb-1 block">Fecha de entrega</label>
                <Input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Estos datos aparecerán en el ticket.
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto… (Ctrl + K)"
                className="productos-search"
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    e.currentTarget.select();
                  }
                }}
              />
              <Button onClick={() => setNuevoModal(true)} type="default">
                <FaPlus style={{ marginRight: 6 }} />
                Nuevo producto
              </Button>
              <div style={{ flex: 1 }} />
              <Tag color="blue">En carrito: {productosSeleccionados.length}</Tag>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Catálogo */}
              <div className="space-y-3">
                {catalogoFiltrado.length === 0 && (
                  <Empty description="Sin resultados" />
                )}
                {catalogoFiltrado.map((p) => (
                  <div key={p.id} className="cf-product">
                    <div>
                      <h4>{p.nombre}</h4>
                      <div className="meta">{fmtQ(p.precio)} unidad</div>
                      {p.precio_quintal ? (
                        <div className="meta">
                          {fmtQ(p.precio_quintal)} por quintal
                          {p.unidades_por_quintal
                            ? `  ·  ${p.unidades_por_quintal} u/qq`
                            : ""}
                        </div>
                      ) : null}
                      <div className="meta">
                        Stock:{" "}
                        <strong style={{ color: "#e7eaf0" }}>{p.stock}</strong>
                      </div>
                    </div>
                    <Button className="btn-agregar" onClick={() => abrirAgregar(p)} icon={<FaPlus />}>
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>

              {/* Carrito */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Seleccionados</h3>
                {productosSeleccionados.length === 0 && (
                  <Empty description="Aún no has agregado productos" />
                )}
                {productosSeleccionados.map((p) => {
                  const linea =
                    (p.precio_quintal || 0) * (p.cantidadQuintales || 0) +
                    (p.precio || 0) * (p.cantidadUnidades || 0);
                  const usado = totalUnits(p);
                  return (
                    <div key={p.id} className="cf-line">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.nombre}</div>
                          <div className="meta">
                            Stock: {p.stock} · u/qq: {p.unidades_por_quintal || "-"}
                          </div>
                        </div>
                        <Button danger onClick={() => quitar(p.id)} icon={<FaTrash />} />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3 mt-3">
                        {p.precio_quintal ? (
                          <div>
                            <div className="text-xs mb-1">Quintales</div>
                            <InputNumber
                              min={0}
                              value={p.cantidadQuintales || 0}
                              onChange={(v) => setCantidad(p.id, "cantidadQuintales", v)}
                              style={{ width: "100%" }}
                            />
                          </div>
                        ) : <div />}
                        <div>
                          <div className="text-xs mb-1">Unidades</div>
                          <InputNumber
                            min={0}
                            value={p.cantidadUnidades || 0}
                            onChange={(v) => setCantidad(p.id, "cantidadUnidades", v)}
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div className="self-end text-right font-semibold">{fmtQ(linea)}</div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Reservado: {usado} / {p.stock} unidades totales
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in" style={{ maxWidth: 980, margin: "0 auto" }}>
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="Revisa los datos. Si falta el nombre o la fecha te los pediremos antes de crear la factura."
            />
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-lg font-bold">Resumen</h3>
                {productosSeleccionados.length === 0 ? (
                  <Empty description="Sin productos" />
                ) : (
                  productosSeleccionados.map((p) => {
                    const linea =
                      (p.precio_quintal || 0) * (p.cantidadQuintales || 0) +
                      (p.precio || 0) * (p.cantidadUnidades || 0);
                    return (
                      <div key={p.id} className="cf-line">
                        <div className="flex justify-between">
                          <div className="font-semibold">{p.nombre}</div>
                          <div className="font-semibold">{fmtQ(linea)}</div>
                        </div>
                        <div className="meta">
                          {p.cantidadQuintales ? `${p.cantidadQuintales} qq  ·  ` : ""}
                          {p.cantidadUnidades || 0} u
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold">Totales</h3>
                <div className="cf-line">
                  <div className="flex justify-between">
                    <div>Subtotal</div>
                    <div className="font-semibold">{fmtQ(subTotal)}</div>
                  </div>
                </div>
                <div className="cf-line">
                  <div className="text-sm mb-2">Costo de envío (Q)</div>
                  <InputNumber style={{ width: "100%" }} min={0} value={costoEnvio} onChange={(v) => setCostoEnvio(Number(v) || 0)} />
                </div>
                <div className="cf-line">
                  <div className="text-sm mb-2">Descuento total (Q)</div>
                  <InputNumber style={{ width: "100%" }} min={0} value={descuentoTotal} onChange={(v) => setDescuentoTotal(Number(v) || 0)} />
                </div>
                <div className="cf-line">
                  <div className="flex justify-between text-lg">
                    <div className="font-bold">Total</div>
                    <div className="font-extrabold">{fmtQ(total)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actionbar fija */}
      <div className="cf-actionbar">
        <div>
          <Button onClick={confirmarSalir} icon={<FaArrowLeft />}>
            Salir
          </Button>
        </div>

        <div className="cf-total">
          Total: <strong>{fmtQ(total)}</strong>
        </div>

        <div className="flex justify-end gap-2">
          {step > 0 && <Button onClick={prev}>Regresar</Button>}
          {step < 2 ? (
            <Button type="primary" onClick={next}>Siguiente</Button>
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
      </div>

      {/* Modal: nuevo producto */}
      <Modal
        title="Agregar nuevo producto"
        open={nuevoModal}
        onCancel={() => setNuevoModal(false)}
        okText="Guardar"
        onOk={() => {
          nuevoForm.validateFields().then(async (values) => {
            try {
              const res = await fetch(`${API_URL}/productos/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
                },
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error("Error al crear el producto");
              const nuevo = await res.json();
              setProductos((prev) => [nuevo, ...prev]);
              message.success("Producto creado");
              nuevoForm.resetFields();
              setNuevoModal(false);
            } catch (e) {
              message.error(e.message);
            }
          });
        }}
      >
        <Form layout="vertical" form={nuevoForm}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="precio" label="Precio por unidad" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="precio_quintal" label="Precio por quintal">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="unidades_por_quintal" label="Unidades por quintal">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="categoria" label="Categoría">
            <Input />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: completar requeridos y crear */}
      <Modal
        title="Completar datos para crear la factura"
        open={reqOpen}
        onCancel={() => setReqOpen(false)}
        okText="Guardar y crear"
        onOk={() => {
          reqForm.validateFields().then((values) => {
            setNombreCliente(values.nombre_cliente || "");
            setFechaEntrega(values.fecha_entrega || "");
            setReqOpen(false);
            // esperamos un tick para que se actualice el estado y enviamos
            setTimeout(() => submitNow(), 0);
          });
        }}
      >
        <Alert
          type="warning"
          showIcon
          message="Faltan datos"
          description="Necesitamos el nombre del cliente y/o la fecha de entrega para terminar."
          className="mb-3"
        />
        <Form layout="vertical" form={reqForm}>
          <Form.Item
            name="nombre_cliente"
            label="Nombre del cliente"
            rules={[{ required: true, message: "Ingresa el nombre" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fecha_entrega"
            label="Fecha de entrega"
            rules={[{ required: true, message: "Selecciona la fecha" }]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: cantidades al agregar */}
      <Modal
        title={productoTemp ? `Cantidad para: ${productoTemp.nombre}` : "Cantidad"}
        open={cantModal}
        onCancel={() => setCantModal(false)}
        okText="Agregar"
        onOk={() => {
          cantForm.validateFields().then(confirmarAgregar);
        }}
      >
        <Form layout="vertical" form={cantForm}>
          {productoTemp?.precio_quintal ? (
            <Form.Item label="Cantidad x Quintal" name="cantidadQuintales" initialValue={0}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          ) : null}
          <Form.Item label="Cantidad x Unidad" name="cantidadUnidades" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          {productoTemp && (
            <div className="text-xs text-gray-500">
              Stock disponible: {productoTemp.stock}{" "}
              {productoTemp.unidades_por_quintal ? `(u/qq: ${productoTemp.unidades_por_quintal})` : ""}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
