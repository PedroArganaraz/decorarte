"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DropdownCarrusel() {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera)
    }
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [abierto])

  const navegar = (vista: string) => {
    setAbierto(false)
    router.push(`/hero?vista=${vista}`)
  }

  const estiloOpcion: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    fontSize: "10px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    color: "var(--color-texto)",
    border: "none",
    borderBottom: "0.5px solid var(--color-borde)",
    cursor: "pointer",
    textAlign: "left",
    whiteSpace: "nowrap",
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setAbierto((prev) => !prev)}
        style={{
          padding: "10px 20px",
          fontSize: "10px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backgroundColor: "var(--color-texto)",
          color: "var(--color-fondo)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
        }}
      >
        Editar carrusel
        <span style={{
          fontSize: "8px",
          transform: abierto ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
          display: "inline-block",
        }}>
          ▼
        </span>
      </button>

      {abierto && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          right: 0,
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          zIndex: 50,
          minWidth: "160px",
        }}>
          <button onClick={() => navegar("desktop")} style={estiloOpcion}>
            Vista Web
          </button>
          <button
            onClick={() => navegar("mobile")}
            style={{ ...estiloOpcion, borderBottom: "none" }}
          >
            Vista Celular
          </button>
        </div>
      )}
    </div>
  )
}
