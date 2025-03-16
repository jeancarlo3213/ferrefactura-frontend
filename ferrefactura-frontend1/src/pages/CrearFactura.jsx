import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Ant Design
import { Input, Button, message } from "antd";
// React Icons
import { FaPlus, FaCheckCircle, FaSearch, FaTrash } from "react-icons/fa";

function CrearFactura() {
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [totalFactura, setTotalFactura] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado para la búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Para redirigir tras crear la factura
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Cargar productos desde el backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/productos/", {
          headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) throw new Error("No autorizado");
        const data = await response.json();

        const productosProcesados = data.map((producto) => {
          const unidadesPorQuintal = producto.unidades_por_quintal || 1;
          const stockQuintales = producto.unidades_por_quintal
            ? Math.floor(producto.stock / unidadesPorQuintal)
            : null;
          const unidadesRestantes = producto.unidades_por_quintal
            ? producto.stock % unidadesPorQuintal
            : producto.stock;

          return {
            ...producto,
            precio: parseFloat(producto.precio) || 0,
            precio_quintal: producto.precio_quintal
              ? parseFloat(producto.precio_quintal)
              : null,
            stockQuintales,
            unidadesRestantes,
            // Valor por si se aplica descuento unitario
            descuentoPorUnidad: 0,
          };
        });

        setProductos(productosProcesados);
      } catch {
        setError("Error al obtener los productos");
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, [token]);

  // Calcular total de la factura
  const calcularTotal = useCallback(() => {
    const totalProductos = productosSeleccionados.reduce((acc, p) => {
      // Convertir quintales a unidades
      const totalUnidadesQuintal = p.precio_quintal
        ? p.cantidadQuintales * (p.unidades_por_quintal || 1)
        : 0;
      const subtotal =
        (totalUnidadesQuintal + p.cantidadUnidades) * (p.precio || 0) -
        p.descuentoPorUnidad * p.cantidadUnidades;
      return acc + subtotal;
    }, 0);

    setTotalFactura(
      totalProductos +
        (parseFloat(costoEnvio) || 0) -
        (parseFloat(descuentoTotal) || 0)
    );
  }, [productosSeleccionados, costoEnvio, descuentoTotal]);

  useEffect(() => {
    calcularTotal();
  }, [productosSeleccionados, costoEnvio, descuentoTotal, calcularTotal]);

  // Quitar producto de seleccionados
  const quitarProducto = (id) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));
  };

  // Modificar cantidad/quintal
  const modificarCantidad = (id, campo, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let nuevoValor = parseFloat(valor) || 0;
          if (nuevoValor < 0) return p;

          // Calcular total de unidades que se van a consumir
          let { cantidadQuintales, cantidadUnidades } = p;
          if (campo === "cantidadQuintales") {
            cantidadQuintales = nuevoValor;
          } else if (campo === "cantidadUnidades") {
            cantidadUnidades = nuevoValor;
          }

          // totalUnidadesConsumidas = quintales * (unidades_por_quintal) + cantidadUnidades
          const totalUnidadesQuintal = p.precio_quintal
            ? cantidadQuintales * (p.unidades_por_quintal || 1)
            : 0;
          const totalNecesarias = totalUnidadesQuintal + cantidadUnidades;

          // Revisar si no excede el stock
          if (totalNecesarias > p.stock) {
            message.warning("No hay suficiente stock para esa cantidad");
            return p; // No actualiza
          }

          return { ...p, [campo]: nuevoValor };
        }
        return p;
      })
    );
    calcularTotal();
  };

  // Modificar descuento por unidad
  const modificarDescuento = (id, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, descuentoPorUnidad: parseFloat(valor) || 0 } : p
      )
    );
    calcularTotal();
  };

  // Confirmar Factura
  const confirmarFactura = async () => {
    // Preparar payload
    const payload = {
      nombre_cliente: nombreCliente,
      fecha_entrega: fechaEntrega,
      costo_envio: costoEnvio,
      descuento_total: descuentoTotal,
      usuario_id: 1, // Ajustar si tu backend lo requiere
      productos: productosSeleccionados.map((prod) => {
        // totalUnidadesConsumidas:
        const totalUnidadesQuintal = prod.precio_quintal
          ? prod.cantidadQuintales * (prod.unidades_por_quintal || 1)
          : 0;
        const totalUnidades = totalUnidadesQuintal + prod.cantidadUnidades;

        return {
          producto_id: prod.id,
          cantidad: totalUnidades,
          precio_unitario: prod.precio,
        };
      }),
    };

    try {
      // Crear la factura
      const response = await fetch("http://127.0.0.1:8000/api/facturas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al crear la factura");
      }

      const data = await response.json();

      // Actualizar stock en el backend
      for (const prodSel of productosSeleccionados) {
        const totalUnidadesQuintal = prodSel.precio_quintal
          ? prodSel.cantidadQuintales * (prodSel.unidades_por_quintal || 1)
          : 0;
        const totalUnidadesConsumidas =
          totalUnidadesQuintal + prodSel.cantidadUnidades;

        const nuevoStock = prodSel.stock - totalUnidadesConsumidas;

        await fetch(`http://127.0.0.1:8000/api/productos/${prodSel.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ stock: nuevoStock }),
        });
      }

      message.success(`¡Factura creada con éxito! ID: ${data.id}`, 3);

      navigate(`/verfactura/${data.id}`);
    } catch (error) {
      message.error(`Error: ${error.message}`);
    }
  };

  // Agregar producto a la lista
  const agregarProducto = (producto) => {
    // Si stock <= 0, no se puede agregar
    if (producto.stock <= 0) {
      message.warning("Este producto no tiene stock disponible");
      return;
    }

    setProductosSeleccionados((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev;
      } else {
        return [
          ...prev,
          {
            ...producto,
            cantidadQuintales: 0,
            cantidadUnidades: 0,
            descuentoPorUnidad: 0,
          },
        ];
      }
    });
    calcularTotal();
  };

  if (loading) {
    return <p className="text-center text-white">Cargando productos...</p>;
  }
  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      {/* Título principal */}
      <h1 className="text-3xl font-bold text-center mb-6">
        FERRETERÍA EL CAMPESINO
      </h1>

      {/* Campos para Cliente, Fecha, Costo de Envío, etc. */}
      <div className="space-y-3">
        <label className="block text-sm text-gray-300">Nombre del Cliente</label>
        <Input
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          className="border border-gray-600 !bg-gray-800 !text-white"
          placeholder="Ej: Juan Pérez"
        />

        <label className="block text-sm text-gray-300">Fecha de Entrega</label>
        <Input
          type="date"
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
          className="border border-gray-600 !bg-gray-800 !text-white"
        />

        <label className="block text-sm text-gray-300">Costo de Envío</label>
        <Input
          type="number"
          value={costoEnvio}
          onChange={(e) => setCostoEnvio(Number(e.target.value))}
          className="border border-gray-600 !bg-gray-800 !text-white"
          placeholder="Ej: 50"
        />

        <label className="block text-sm text-gray-300">Descuento Total</label>
        <Input
          type="number"
          value={descuentoTotal}
          onChange={(e) => setDescuentoTotal(Number(e.target.value))}
          className="border border-gray-600 !bg-gray-800 !text-white"
          placeholder="Ej: 10"
        />
      </div>

      {/* Lista de Productos Seleccionados */}
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Lista de Productos Seleccionados
      </h2>
      {productosSeleccionados.map((p) => (
        <div
          key={p.id}
          className="flex justify-between items-center p-3 border-b border-gray-700"
        >
          <span className="flex-1">{p.nombre}</span>

          {/* Cantidad por Quintal */}
          {p.precio_quintal !== null && (
            <div className="text-center mx-2">
              <span className="block text-sm text-gray-400">
                Cantidad por Quintal
              </span>
              <Input
                type="number"
                value={p.cantidadQuintales}
                onChange={(e) =>
                  modificarCantidad(p.id, "cantidadQuintales", e.target.value)
                }
                className="!w-16 !border-gray-600 !bg-gray-800 !text-white text-center"
                placeholder="0"
              />
            </div>
          )}

          {/* Cantidad por Unidad */}
          <div className="text-center mx-2">
            <span className="block text-sm text-gray-400">
              Cantidad por Unidad
            </span>
            <Input
              type="number"
              value={p.cantidadUnidades}
              onChange={(e) =>
                modificarCantidad(p.id, "cantidadUnidades", e.target.value)
              }
              className="!w-16 !border-gray-600 !bg-gray-800 !text-white text-center"
              placeholder="0"
            />
          </div>

          {/* Descuento por Unidad */}
          <div className="text-center mx-2">
            <span className="block text-sm text-gray-400">
              Descuento por Unidad
            </span>
            <Input
              type="number"
              value={p.descuentoPorUnidad}
              onChange={(e) => modificarDescuento(p.id, e.target.value)}
              className="!w-16 !border-gray-600 !bg-gray-800 !text-white text-center"
              placeholder="0"
            />
          </div>

          {/* Total por producto */}
          <span className="font-bold mx-2">
            {(() => {
              // Para mostrar el total de este producto: quintales→unidades + p.cantidadUnidades
              const totalUnidadesQuintal = p.precio_quintal
                ? p.cantidadQuintales * (p.unidades_por_quintal || 1)
                : 0;
              const subtotal =
                (totalUnidadesQuintal + p.cantidadUnidades) * (p.precio || 0) -
                p.descuentoPorUnidad * p.cantidadUnidades;
              return `Total: Q${subtotal.toFixed(2)}`;
            })()}
          </span>

          {/* Botón para quitar producto */}
          <Button
            type="ghost"
            icon={<FaTrash />}
            onClick={() => quitarProducto(p.id)}
            className="!border-none text-red-400 hover:text-red-600"
          />
        </div>
      ))}

      {/* Input de búsqueda de productos */}
      <div className="mt-6">
        <label className="block text-sm text-gray-300 mb-1">
          <FaSearch className="inline mr-2" />
          Buscar producto (por nombre o ID)
        </label>
        <Input
          type="text"
          className="border border-gray-600 !bg-gray-800 !text-white"
          placeholder="Ej: Pintura o 1"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de Productos Disponibles */}
      <h2 className="text-xl font-semibold mt-4 mb-2">
        Lista de Productos Disponibles
      </h2>
      {productos
        .filter((prod) => {
          if (!busqueda || !busqueda.trim()) return true;
          const texto = busqueda.toLowerCase();
          return (
            prod.nombre.toLowerCase().includes(texto) ||
            String(prod.id).includes(texto)
          );
        })
        .map((producto) => (
          <div
            key={producto.id}
            className="flex justify-between items-center p-3 border-b border-gray-700"
          >
            <span>
              {producto.nombre} - Q
              {producto.precio.toFixed(2)}
            </span>
            {producto.precio_quintal && (
              <span>
                Q
                {producto.precio_quintal.toFixed(2)} por quintal
              </span>
            )}
            <span>
              Stock: {producto.stock > 0 ? producto.stock : 0} unidades
            </span>
            <Button
              type="default"
              icon={<FaPlus />}
              onClick={() => {
                agregarProducto(producto);
              }}
              className="bg-blue-500 text-white border-none hover:bg-blue-600"
              // Deshabilitar si no hay stock
              disabled={producto.stock <= 0}
            >
              Agregar
            </Button>
          </div>
        ))}

      {/* Total Final */}
      <h2 className="text-xl font-semibold mt-6">
        Total: Q{totalFactura.toFixed(2)}
      </h2>

      <Button
        type="primary"
        icon={<FaCheckCircle />}
        className="w-full !bg-green-500 !border-none hover:!bg-green-600"
        disabled={productosSeleccionados.length === 0}
        onClick={confirmarFactura}
      >
        Confirmar Factura
      </Button>
    </div>
  );
}

export default CrearFactura;
