"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function FormularioCategoria() {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al crear la categoría")
      setCargando(false)
      return
    }

    toast.success("Categoría creada correctamente")
    setNombre("")
    setDescripcion("")
    setAbierto(false)
    router.refresh()
    setCargando(false)
  }

  const estiloInput = {
    padding: "10px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    width: "100%",
  } as React.CSSProperties

  const estiloLabel = {
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-texto-muted)",
    display: "block",
    marginBottom: "6px",
  } as React.CSSProperties

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          padding: "10px 20px",
          fontSize: "11px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backgroundColor: "var(--color-texto)",
          color: "var(--color-fondo)",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        + Nueva categoría
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setAbierto(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(44, 44, 42, 0.3)",
          zIndex: 100,
          border: "none",
          cursor: "pointer",
        }}
      />
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 101,
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "32px",
        width: "360px",
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "22px",
          fontWeight: 400,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
          marginBottom: "24px",
        }}>
          Nueva categoría
        </h2>

        <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={estiloLabel}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Anillos"
              style={estiloInput}
            />
          </div>

          <div>
            <label style={estiloLabel}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Opcional"
              style={{ ...estiloInput, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              type="submit"
              disabled={cargando}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: cargando ? "var(--color-texto-muted)" : "var(--color-texto)",
                color: "var(--color-fondo)",
                border: "none",
                borderRadius: 0,
                cursor: cargando ? "not-allowed" : "pointer",
              }}
            >
              {cargando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: "var(--color-texto)",
                border: "0.5px solid var(--color-texto)",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
