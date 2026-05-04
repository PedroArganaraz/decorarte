"use client"

import { useState } from "react"
import { usarCarrito } from "@/tiendas/carritoTienda"
import DrawerCarrito from "./DrawerCarrito"

export default function IconoCarrito() {
  const [abierto, setAbierto] = useState(false)
  const items = usarCarrito((s) => s.items)
  const totalItems = items.reduce((t, i) => t + i.cantidad, 0)

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        style={{
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px",
          color: "var(--color-texto)",
          position: "relative",
        }}
        aria-label="Abrir carrito"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        {totalItems > 0 && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "16px",
            height: "16px",
            backgroundColor: "var(--color-acento)",
            color: "#FFFFFF",
            fontSize: "9px",
            fontWeight: 500,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {totalItems}
          </span>
        )}
      </button>

      <DrawerCarrito
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
      />
    </>
  )
}
