"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  id: string
  nombre: string
}

export default function EliminarProducto({ id, nombre }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const eliminar = async () => {
    setCargando(true)

    const res = await fetch(`/api/productos/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al eliminar el producto")
      setCargando(false)
      setConfirmando(false)
      return
    }

    toast.success("Producto eliminado")
    router.push("/panel/productos")
    router.refresh()
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        <span style={{
          fontSize: "12px",
          color: "var(--color-texto-muted)",
          letterSpacing: "0.03em",
          lineHeight: 1.4,
        }}>
          ¿Eliminás &quot;{nombre}&quot; y todas sus imágenes?
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={eliminar}
          disabled={cargando}
          style={{
            flex: 1,
            padding: "8px 8px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "#A32D2D",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 0,
            cursor: cargando ? "not-allowed" : "pointer",
          }}
        >
          {cargando ? "Eliminando..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          style={{
            flex: 1,
            padding: "8px 8px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto-muted)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      style={{
        padding: "12px 24px",
        fontSize: "11px",
        fontFamily: "'Jost', sans-serif",
        fontWeight: 400,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        backgroundColor: "transparent",
        color: "#A32D2D",
        border: "0.5px solid #A32D2D",
        borderRadius: 0,
        cursor: "pointer",
        width: "100%",
      }}
    >
      Eliminar producto
    </button>
  )
}
