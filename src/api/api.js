// src/api/api.js
const API_URL = import.meta.env.VITE_API_URL;

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error("Error en la autenticación");
  }
  return response.json();
};

export const fetchUsuarios = async (token) => {
  const response = await fetch(`${API_URL}/usuarios/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.json();
};

export const fetchProductos = async (token) => {
  const response = await fetch(`${API_URL}/productos/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.json();
};

export const fetchFacturas = async (token) => {
  const response = await fetch(`${API_URL}/facturas/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.json();
};

export const createFactura = async (factura, token) => {
  const response = await fetch(`${API_URL}/facturas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify(factura),
  });
  return response.json();
};

export const createUsuario = async (usuario, token) => {
  const response = await fetch(`${API_URL}/usuarios/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify(usuario),
  });
  return response.json();
};

export const createProducto = async (producto, token) => {
  const response = await fetch(`${API_URL}/productos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify(producto),
  });
  return response.json();
};
