import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";
import theme from "./theme";

/* Estilos globales de tema */
import "./styles/theme.css";
import "./styles/global.css";

/* tipografía Inter */
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap";
document.head.appendChild(link);

/* aplica último tema guardado */
const saved = localStorage.getItem("theme") || "theme-blue";
document.documentElement.classList.add(saved);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);

