"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  id: number
  titulo: string
}

export default function EliminarNota({ id, titulo }: Props) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)

  const eliminar = async () => {
    setCargando(true)
    const res = await fetch(`/api/notas/${id}`, { method: "DELETE" })

    if (!res.ok) {
      toast.error("Error al eliminar la nota")
      setCargando(false)
      setConfirmando(false)
      return
    }

    toast.success("Nota eliminada")
    router.push("/panel/notas")
    router.refresh()
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{
          fontSize: "11px",
          fontFamily: "'Jost', sans-serif",
          color: "var(--color-texto-muted)",
          letterSpacing: "0.05em",
        }}>
          ¿Eliminar "{titulo}"?
        </span>
        <button
          onClick={eliminar}
          disabled={cargando}
          style={{
            padding: "6px 14px",
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-acento)",
            color: "#fff",
            border: "none",
            borderRadius: 0,
            cursor: cargando ? "default" : "pointer",
            opacity: cargando ? 0.6 : 1,
          }}
        >
          Confirmar
        </button>
        <button
          onClick={() => setConfirmando(false)}
          style={{
            padding: "6px 14px",
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      style={{
        padding: "8px 16px",
        fontSize: "10px",
        fontFamily: "'Jost', sans-serif",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        backgroundColor: "transparent",
        color: "var(--color-acento)",
        border: "0.5px solid var(--color-acento)",
        borderRadius: 0,
        cursor: "pointer",
      }}
    >
      Eliminar nota
    </button>
  )
}
