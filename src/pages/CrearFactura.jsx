import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Ant Design
import { Input, Button, message } from "antd";
// React Icons
import { FaPlus, FaCheckCircle, FaSearch, FaTrash } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

function CrearFactura() {
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [totalFactura, setTotalFactura] = useState(0);

  const [loadingProductos, setLoadingProductos] = useState(true); // Para mostrar "Cargando..."
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // Evita doble clic en "Confirmar"

  // Estado para la búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Para redirigir tras crear la factura
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // -------------------------------------------------------------------
  // 1) Cargar productos desde el backend
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchProductos = async () => {
      setLoadingProductos(true);
      setError(""); // Limpiamos cualquier error previo
      try {
        const response = await fetch(`${API_URL}/productos/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("No autorizado. Verifica tu sesión.");
          } else {
            throw new Error("Error al obtener los productos.");
          }
        }
        const data = await response.json();

        const productosProcesados = data.map((producto) => {
          const unidadesPorQuintal = producto.unidades_por_quintal || 1;

          return {
            ...producto,
            precio: parseFloat(producto.precio) || 0,
            precio_quintal: producto.precio_quintal
              ? parseFloat(producto.precio_quintal)
              : null,
            descuentoPorUnidad: 0, // Valor inicial para el descuento
            // Estos campos son opcionales para la lógica de stock
            stockQuintales: producto.unidades_por_quintal
              ? Math.floor(producto.stock / unidadesPorQuintal)
              : null,
            unidadesRestantes: producto.unidades_por_quintal
              ? producto.stock % unidadesPorQuintal
              : producto.stock,
          };
        });

        setProductos(productosProcesados);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al obtener los productos.");
      } finally {
        setLoadingProductos(false);
      }
    };

    fetchProductos();
  }, [token]);

  // -------------------------------------------------------------------
  // 2) Calcular total de la factura
  // -------------------------------------------------------------------
  const calcularTotal = useCallback(() => {
    const totalProductos = productosSeleccionados.reduce((acc, p) => {
      // Precio por quintales
      const costQuintales = p.cantidadQuintales * (p.precio_quintal || 0);

      // Precio por unidades
      const costUnidades = p.cantidadUnidades * (p.precio || 0);

      // Descuento solo aplica a las unidades
      const discount = p.descuentoPorUnidad * p.cantidadUnidades;

      return acc + costQuintales + costUnidades - discount;
    }, 0);

    const total =
      totalProductos +
      (parseFloat(costoEnvio) || 0) -
      (parseFloat(descuentoTotal) || 0);

    setTotalFactura(total);
  }, [productosSeleccionados, costoEnvio, descuentoTotal]);

  // Llamamos a calcularTotal cada vez que algo cambie
  useEffect(() => {
    calcularTotal();
  }, [productosSeleccionados, costoEnvio, descuentoTotal, calcularTotal]);

  // -------------------------------------------------------------------
  // 3) Quitar producto de los seleccionados
  // -------------------------------------------------------------------
  const quitarProducto = (id) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.id !== id));
  };

  // -------------------------------------------------------------------
  // 4) Modificar la cantidad (quintales o unidades)
  // -------------------------------------------------------------------
  const modificarCantidad = (id, campo, valor) => {
    setProductosSeleccionados((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let nuevoValor = parseFloat(valor) || 0;
          if (nuevoValor < 0) return p; // Evitamos valores negativos

          // Si este producto maneja quintales y el usuario intenta poner
          // "cantidadUnidades" >= (unidades_por_quintal)
          // le sugerimos mejor usar un quintal
          if (
            campo === "cantidadUnidades" &&
            p.precio_quintal !== null &&
            p.unidades_por_quintal &&
            nuevoValor >= p.unidades_por_quintal
          ) {
            message.warning(
              "Para solicitar tantas unidades, selecciona un quintal en su lugar."
            );
            return p; // No actualiza
          }

          let { cantidadQuintales, cantidadUnidades } = p;
          if (campo === "cantidadQuintales") {
            cantidadQuintales = nuevoValor;
          } else if (campo === "cantidadUnidades") {
            cantidadUnidades = nuevoValor;
          }

          // total de unidades usando quintales
          const unidadesPorQuintal = p.unidades_por_quintal || 1;
          const totalUnidadesQuintal = p.precio_quintal
            ? cantidadQuintales * unidadesPorQuintal
            : 0;
          const totalNecesarias = totalUnidadesQuintal + cantidadUnidades;

          // Revisar si no excede el stock (en varillas)
          if (totalNecesarias > p.stock) {
            message.warning("No hay suficiente stock para esa cantidad.");
            return p; // No actualiza
          }

          return { ...p, cantidadQuintales, cantidadUnidades };
        }
        return p;
      })
    );
    calcularTotal();
  };

  // -------------------------------------------------------------------
  // 5) Modificar descuento por unidad
  // -------------------------------------------------------------------
  const modificarDescuento = (id, valor) => {
    const nuevoDescuento = parseFloat(valor) || 0;
    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, descuentoPorUnidad: nuevoDescuento } : p
      )
    );
    calcularTotal();
  };

  // -------------------------------------------------------------------
  // 6) Agregar producto a la lista de seleccionados
  // -------------------------------------------------------------------
  const agregarProducto = (producto) => {
    if (producto.stock <= 0) {
      message.warning("Este producto no tiene stock disponible.");
      return;
    }
    setProductosSeleccionados((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev; // ya existe
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

  // -------------------------------------------------------------------
  // 7) Confirmar Factura
  // -------------------------------------------------------------------
  const confirmarFactura = async () => {
    // Validaciones básicas
    if (!nombreCliente.trim()) {
      message.error("Falta el nombre del cliente.");
      return;
    }
    if (!fechaEntrega) {
      message.error("Falta la fecha de entrega.");
      return;
    }
    if (productosSeleccionados.length === 0) {
      message.error("Debes seleccionar al menos un producto.");
      return;
    }

    setSubmitting(true);

    // Armado del payload de la factura:
    // 🔸 Creamos múltiples líneas si hay quintales y unidades.
    const payload = {
      nombre_cliente: nombreCliente,
      fecha_entrega: fechaEntrega,
      costo_envio: costoEnvio,
      descuento_total: descuentoTotal,
      usuario_id: 1, // Ajustar según tu backend
      productos: [],
    };

    // Recorremos cada producto seleccionado
    productosSeleccionados.forEach((prod) => {
      const unidadesPorQuintal = prod.unidades_por_quintal || 1;

      // Si se compraron quintales, creamos la línea para quintales
      if (prod.cantidadQuintales > 0) {
        payload.productos.push({
          producto_id: prod.id,
          cantidad: prod.cantidadQuintales, // Cuántos quintales
          precio_unitario: prod.precio_quintal, // Precio por quintal
        });
      }

      // Si se compraron unidades, creamos la línea para unidades
      if (prod.cantidadUnidades > 0) {
        payload.productos.push({
          producto_id: prod.id,
          cantidad: prod.cantidadUnidades, // Cuántas unidades
          precio_unitario: prod.precio, // Precio unitario
        });
      }
    });

    try {
      // 7.1) Crear la factura en el servidor
      const responseFactura = await fetch(`${API_URL}/facturas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!responseFactura.ok) {
        throw new Error("Error al crear la factura en el servidor.");
      }

      const dataFactura = await responseFactura.json();

      // 7.2) Actualizar stock de cada producto
      //     Tenemos que restar la cantidad total de varillas del stock
      const stockUpdatePromises = productosSeleccionados.map(async (prodSel) => {
        const unPorQ = prodSel.unidades_por_quintal || 1;

        // Convertir a varillas
        const totalUnidadesQuintal = prodSel.cantidadQuintales * unPorQ;
        const totalUnidadesConsumidas =
          totalUnidadesQuintal + prodSel.cantidadUnidades;

        // Restar al stock (en varillas)
        const nuevoStock = prodSel.stock - totalUnidadesConsumidas;

        // PATCH al producto con el nuevo stock
        const responseStock = await fetch(
          `${API_URL}/productos/${prodSel.id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({ stock: nuevoStock }),
          }
        );

        if (!responseStock.ok) {
          throw new Error(
            `Error al actualizar stock del producto ${prodSel.nombre}.`
          );
        }
      });

      await Promise.all(stockUpdatePromises);

      // Factura creada con éxito
      message.success(`¡Factura creada con éxito! ID: ${dataFactura.id}`, 3);
      navigate(`/verfactura/${dataFactura.id}`);
    } catch (error) {
      console.error(error);
      message.error(`Error: ${error.message}`);
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // 8) Render principal
  // -------------------------------------------------------------------
  if (loadingProductos) {
    return (
      <p className="text-center text-white">Cargando productos...</p>
    );
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

          {/* Cantidad por Quintal (si aplica) */}
          {p.precio_quintal !== null && (
            <div className="text-center mx-2">
              <span className="block text-sm text-gray-400">
                Cantidad Quintales
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
              Cantidad Unidades
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

          {/* Total por producto (para mostrar en pantalla, no en DB) */}
          <span className="font-bold mx-2">
            {(() => {
              const costQ = p.cantidadQuintales * (p.precio_quintal || 0);
              const costU = p.cantidadUnidades * (p.precio || 0);
              const discount = p.descuentoPorUnidad * p.cantidadUnidades;
              const subtotal = costQ + costU - discount;
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

      {/* Búsqueda de productos */}
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
            <span>Stock: {producto.stock > 0 ? producto.stock : 0} unidades</span>

            <Button
              type="default"
              icon={<FaPlus />}
              onClick={() => agregarProducto(producto)}
              className="bg-blue-500 text-white border-none hover:bg-blue-600"
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

      {/* Botón Confirmar Factura */}
      <Button
        type="primary"
        icon={<FaCheckCircle />}
        className="w-full !bg-green-500 !border-none hover:!bg-green-600"
        disabled={productosSeleccionados.length === 0 || submitting}
        onClick={confirmarFactura}
      >
        {submitting ? "Enviando..." : "Confirmar Factura"}
      </Button>
    </div>
  );
}

export default CrearFactura;
