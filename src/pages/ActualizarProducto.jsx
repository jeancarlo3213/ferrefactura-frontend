import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

function ActualizarProducto() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/productos/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        if (!response.ok) throw new Error("Error al obtener los productos.");
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        message.error(error.message);
      }
    };

    fetchProductos();
  }, []);

  // Maneja los cambios en el formulario (para recalcular precio, etc.)
  const onValuesChange = (changedValues, allValues) => {
    const { precio_quintal, unidades_por_quintal } = allValues;

    // Si cambian precio_quintal o unidades_por_quintal,
    // recalculamos 'precio' si ambos son válidos:
    if ("precio_quintal" in changedValues || "unidades_por_quintal" in changedValues) {
      if (precio_quintal && unidades_por_quintal > 0) {
        const nuevoPrecio = precio_quintal / unidades_por_quintal;
        form.setFieldsValue({ precio: Number(nuevoPrecio.toFixed(2)) });
      }
    }

    // Si quieres que cambiar "precio" afecte a "precio_quintal", lo manejas también:
    // if ("precio" in changedValues) {
    //   if (unidades_por_quintal && unidades_por_quintal > 0) {
    //     const nuevoPrecioQuintal = allValues.precio * unidades_por_quintal;
    //     form.setFieldsValue({ precio_quintal: nuevoPrecioQuintal.toFixed(2) });
    //   }
    // }
  };

  const onFinish = async (values) => {
    if (!productoSeleccionado) {
      message.error("Seleccione un producto.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/productos/${productoSeleccionado}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(values),
        }
      );
      if (!response.ok) throw new Error("No se pudo actualizar el producto.");

      message.success("Producto actualizado con éxito.");
      navigate("/productos");
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cuando se selecciona un producto en el Select, populamos los campos del formulario
  const handleSelectProducto = (idProducto) => {
    setProductoSeleccionado(idProducto);
    const producto = productos.find((p) => p.id === idProducto);

    if (producto) {
      form.setFieldsValue({
        nombre: producto.nombre,
        precio: producto.precio ? Number(producto.precio) : undefined,
        precio_quintal: producto.precio_quintal
          ? Number(producto.precio_quintal)
          : undefined,
        unidades_por_quintal: producto.unidades_por_quintal
          ? Number(producto.unidades_por_quintal)
          : undefined,
        stock: producto.stock ?? 0,
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-6">
      <Card className="w-full max-w-lg bg-gray-800 text-white shadow-lg">
        <Title level={2} className="text-center text-yellow-400">
          Actualizar Producto
        </Title>

        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          onValuesChange={onValuesChange}
        >
          <Form.Item label="Seleccionar Producto">
            <Select
              showSearch
              placeholder="Buscar producto..."
              optionFilterProp="label"
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleSelectProducto}
            >
              {productos.map((prod) => (
                <Option
                  key={prod.id}
                  value={prod.id}
                  label={prod.nombre} // para el filtro
                >
                  {prod.nombre} (ID: {prod.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Nuevo Nombre" name="nombre">
            <Input placeholder="Nuevo nombre (opcional)" />
          </Form.Item>

          <Form.Item label="Precio / Unidad (Q)" name="precio">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Precio / Quintal (Q)" name="precio_quintal">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Unidades por Quintal" name="unidades_por_quintal">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Nuevo Stock" name="stock">
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-yellow-500"
          >
            Actualizar Producto
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default ActualizarProducto;
