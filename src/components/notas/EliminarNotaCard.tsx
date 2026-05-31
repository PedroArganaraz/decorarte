"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface Props {
  id: number
  titulo: string
}

export default function EliminarNotaCard({ id, titulo }: Props) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)

  const eliminar = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCargando(true)

    const res = await fetch(`/api/notas/${id}`, { method: "DELETE" })

    if (!res.ok) {
      toast.error("Error al eliminar la nota")
      setCargando(false)
      setConfirmando(false)
      return
    }

    toast.success("Nota eliminada")
    router.refresh()
  }

  const iniciarConfirmacion = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmando(true)
  }

  const cancelar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmando(false)
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.preventDefault()}>
        <button
          onClick={eliminar}
          disabled={cargando}
          style={{
            padding: "4px 10px",
            fontSize: "9px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-acento)",
            color: "#fff",
            border: "none",
            borderRadius: 0,
            cursor: cargando ? "default" : "pointer",
            opacity: cargando ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          Confirmar
        </button>
        <button
          onClick={cancelar}
          style={{
            padding: "4px 10px",
            fontSize: "9px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto-muted)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={iniciarConfirmacion}
      title={`Eliminar "${titulo}"`}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        color: "var(--color-texto-muted)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <Trash2 size={14} strokeWidth={1.5} />
    </button>
  )
}
