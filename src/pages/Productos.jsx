import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Button, Input, Modal, message, Form, InputNumber } from "antd";
import "../styles/productos.css";

const API_URL = import.meta.env.VITE_API_URL;

const fmt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modo, setModo] = useState("ver");
  const [productoSel, setProductoSel] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState([{ id: "nombre", desc: false }]); // orden por defecto
  const [shrinkLogo, setShrinkLogo] = useState(false);
  const [form] = Form.useForm();

  // Shrink del logo al hacer scroll
  useEffect(() => {
    const onScroll = () => setShrinkLogo(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function obtenerProductos() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/productos/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message);
    }
  }

  useEffect(() => {
    obtenerProductos();
  }, []);

  const abrirModal = (modo, producto = null) => {
    setModo(modo);
    setProductoSel(producto);
    if (producto) form.setFieldsValue(producto);
    else form.resetFields();
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    form.resetFields();
    setProductoSel(null);
  };

  const onFinish = async (values) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const url =
      modo === "actualizar"
        ? `${API_URL}/productos/${productoSel.id}/`
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
        let msg = "Error al guardar";
        try { const data = await res.json(); msg = data.detail || msg; } catch {}
        throw new Error(msg);
      }

      message.success(
        `Producto ${modo === "actualizar" ? "actualizado" : "agregado"} correctamente`
      );
      obtenerProductos();
      cerrarModal();
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Columnas con formateo
  const columns = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 60 },
      { header: "Nombre", accessorKey: "nombre", enableSorting: true },
      { header: "Precio (Q)", accessorKey: "precio", enableSorting: true, cell: (info) => fmt(info.getValue()) },
      { header: "Precio Quintal", accessorKey: "precio_quintal", enableSorting: true, cell: (info) => fmt(info.getValue()) },
      { header: "Unidades x Quintal", accessorKey: "unidades_por_quintal", enableSorting: true, cell: (info) => info.getValue() ?? "—" },
      { header: "Precio Compra Unidad", accessorKey: "precio_compra_unidad", enableSorting: true, cell: (info) => fmt(info.getValue()) },
      { header: "Precio Compra Quintal", accessorKey: "precio_compra_quintal", enableSorting: true, cell: (info) => fmt(info.getValue()) },
      { header: "Stock", accessorKey: "stock", enableSorting: true, cell: (info) => info.getValue() ?? 0 },
      { header: "Categoría", accessorKey: "categoria", enableSorting: true, cell: (info) => info.getValue() || "—" },
      {
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div style={{ display:"flex", gap:8 }}>
            <Button className="btn-editar" onClick={() => abrirModal("actualizar", row.original)}><FaEdit /> Editar</Button>
            <Button className="btn-eliminar" onClick={() => eliminarProducto(row.original.id)}><FaTrash /> Eliminar</Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: productos,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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

  // Helper para icono de sort
  const SortIcon = ({ col }) => {
    const dir = col.getIsSorted(); // 'asc' | 'desc' | false
    return (
      <span className="sort-icon-wrap" style={{ display:"inline-flex", gap:4 }}>
        {!dir && <FaSort className="sort-icon" />}
        {dir === "asc" && <FaSortUp className="sort-icon up" />}
        {dir === "desc" && <FaSortDown className="sort-icon down" />}
      </span>
    );
  };

  const unidadesPorQuintal = Form.useWatch("unidades_por_quintal", form);

  return (
    <div className="productos-container">
      <header className="productos-header">
        <div className={`logo-wrap ${shrinkLogo ? "small" : ""}`}>
          <img src="/Logo.jpeg" alt="Logo" />
        </div>

        <h2 className="productos-title">📦 Gestión de Productos</h2>

        <Button className="btn-accent" onClick={() => abrirModal("agregar")}>
          <FaPlus /> Agregar Producto
        </Button>
      </header>

      <input
        className="productos-search"
        placeholder="🔍 Buscar producto…"
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />

      <div className="productos-table-shell">
        <table className="productos-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted(); // 'asc' | 'desc' | false
                  return (
                    <th key={header.id}>
                      {sortable ? (
                        <div
                          className="th-sort"
                          data-dir={dir || ""}
                          onClick={header.column.getToggleSortingHandler()}
                          role="button"
                          aria-label="Ordenar columna"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && header.column.toggleSorting()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon col={header.column} />
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding:16, color:"var(--muted)" }}>
                  No hay productos que coincidan.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell ?? cell.column.columnDef.header, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={modo === "agregar" ? "Agregar Producto" : "Actualizar Producto"}
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        centered
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={onFinish} className="productos-modal-form">
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true, message:"Ingresa un nombre" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Precio (unidad)" name="precio" rules={[{ required: true, message:"Ingresa el precio" }]}>
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

          <Form.Item label="Stock" name="stock" rules={[{ required: true, message:"Ingresa el stock" }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Categoría" name="categoria" rules={[{ required: true, message:"Ingresa la categoría" }]}>
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
