import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const THEMES = [
  { key: "theme-blue",   label: "Azul"   },
  { key: "theme-purple", label: "Morado" },
  { key: "theme-teal",   label: "Teal"   },
  { key: "theme-amber",  label: "Ámbar"  },
  { key: "theme-rose",   label: "Rosa"   },
  { key: "theme-dynamic",label: "Dinámico" },
];

export default function ThemeSwitcher(){
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "theme-blue");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...THEMES.map(t=>t.key));
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div style={{
      position:"fixed", right:14, bottom:14, zIndex:50,
      background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)",
      borderRadius:14, padding:10, backdropFilter:"blur(8px)"
    }} className="no-print">
      <div style={{ fontSize:12, color:"#9aa3b2", marginBottom:6 }}>Tema</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", maxWidth:240 }}>
        {THEMES.map(t=>(
          <motion.button key={t.key} onClick={()=>setTheme(t.key)}
            whileHover={{ scale:1.08 }} whileTap={{ scale:0.96 }}
            title={t.label} aria-label={t.label}
            style={{
              width:28, height:28, borderRadius:999, cursor:"pointer",
              border: theme===t.key ? "2px solid #e7eaf0":"2px solid transparent",
              background:
                t.key==="theme-blue"   ? "linear-gradient(135deg,#3b82f6,#8b5cf6)":
                t.key==="theme-purple" ? "linear-gradient(135deg,#8b5cf6,#a78bfa)":
                t.key==="theme-teal"   ? "linear-gradient(135deg,#14b8a6,#22d3ee)":
                t.key==="theme-amber"  ? "linear-gradient(135deg,#f59e0b,#f97316)":
                t.key==="theme-rose"   ? "linear-gradient(135deg,#fb7185,#f472b6)":
                                          "conic-gradient(from 0deg,#f43f5e,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#f43f5e)"
            }}
          />
        ))}
      </div>
    </div>
  );
}
