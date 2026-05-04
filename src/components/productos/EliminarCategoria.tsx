"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  id: string
  nombre: string
  tieneProductos: boolean
}

export default function EliminarCategoria({ id, nombre, tieneProductos }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const eliminar = async () => {
    setCargando(true)

    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al eliminar")
      setCargando(false)
      setConfirmando(false)
      return
    }

    toast.success("Categoría eliminada")
    router.refresh()
  }

  if (tieneProductos) {
    return (
      <span style={{
        fontSize: "10px",
        color: "var(--color-texto-sutil)",
        letterSpacing: "0.05em",
      }}>
        Con productos
      </span>
    )
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={eliminar}
          disabled={cargando}
          style={{
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            backgroundColor: "#A32D2D",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          {cargando ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          style={{
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            backgroundColor: "transparent",
            color: "var(--color-texto-muted)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      style={{
        fontSize: "10px",
        fontFamily: "'Jost', sans-serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "4px 10px",
        backgroundColor: "transparent",
        color: "var(--color-texto-muted)",
        border: "0.5px solid var(--color-borde)",
        borderRadius: 0,
        cursor: "pointer",
      }}
    >
      Eliminar
    </button>
  )
}
