import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Button, Input, Modal, message, Form, InputNumber } from "antd";
import "../styles/productos.css";

const API_URL = import.meta.env.VITE_API_URL;

function Productos() {
  const [productos, setProductos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modo, setModo] = useState("ver");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const obtenerProductos = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/productos/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    obtenerProductos();
  }, []);

  const abrirModal = (modo, producto = null) => {
    setModo(modo);
    setProductoSeleccionado(producto);
    if (producto) {
      form.setFieldsValue(producto);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    form.resetFields();
    setProductoSeleccionado(null);
  };

  const onFinish = async (values) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const url = modo === "actualizar"
      ? `${API_URL}/productos/${productoSeleccionado.id}/`
      : `${API_URL}/productos/`;
    const method = modo === "actualizar" ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al guardar");
      }

      message.success(`Producto ${modo === "actualizar" ? "actualizado" : "agregado"} correctamente`);
      obtenerProductos();
      cerrarModal();
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = (id) => {
    Modal.confirm({
      title: "¿Seguro que quieres eliminar este producto?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const res = await fetch(`${API_URL}/productos/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Token ${localStorage.getItem("token")}` },
          });
          if (!res.ok) throw new Error("Error al eliminar");
          message.success("Producto eliminado");
          obtenerProductos();
        } catch (err) {
          message.error(err.message);
        }
      },
    });
  };

  const columns = useMemo(() => [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Precio (Q)", accessorKey: "precio" },
    { header: "Precio Quintal", accessorKey: "precio_quintal" },
    { header: "Unidades x Quintal", accessorKey: "unidades_por_quintal" },
    { header: "Precio Compra Unidad", accessorKey: "precio_compra_unidad" },
    { header: "Precio Compra Quintal", accessorKey: "precio_compra_quintal" },
    { header: "Stock", accessorKey: "stock" },
    { header: "Categoría", accessorKey: "categoria" },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button className="btn-editar" onClick={() => abrirModal("actualizar", row.original)}><FaEdit /> Editar</Button>
          <Button className="btn-eliminar" onClick={() => eliminarProducto(row.original.id)}><FaTrash /> Eliminar</Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: productos,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const unidadesPorQuintal = Form.useWatch("unidades_por_quintal", form);

  return (
    <div className="productos-container">
      <header className="productos-header">
        <div className="logo-wrapper">
          <img src="/Logo.jpeg" alt="Logo" className="logo-hero" />
        </div>
        <h2 className="productos-title">📦 Gestión de Productos</h2>
        <Button className="btn-agregar" onClick={() => abrirModal("agregar")}>
          <FaPlus /> Agregar Producto
        </Button>
      </header>

      <Input
        placeholder="🔍 Buscar producto..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="productos-search"
      />

      <div className="productos-table-container">
        <table className="productos-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={modo === "agregar" ? "Agregar Producto" : "Actualizar Producto"}
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        centered
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          className="productos-modal-form"
        >
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Precio (unidad)" name="precio" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Precio por Quintal" name="precio_quintal">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Unidades por Quintal" name="unidades_por_quintal">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Precio de compra por unidad" name="precio_compra_unidad">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          {unidadesPorQuintal > 0 && (
            <Form.Item label="Precio de compra por quintal" name="precio_compra_quintal">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          )}
          <Form.Item label="Stock" name="stock" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Categoría" name="categoria" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button htmlType="submit" loading={loading} className="modal-btn">
            {modo === "agregar" ? "Agregar" : "Actualizar"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default Productos;
