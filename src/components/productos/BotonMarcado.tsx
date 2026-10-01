"use client"

import { useState } from "react"
import { toast } from "sonner"

interface Props {
  id: string
  marcadoInicial: boolean
}

export default function BotonMarcado({ id, marcadoInicial }: Props) {
  const [marcado, setMarcado] = useState(marcadoInicial)
  const [cargando, setCargando] = useState(false)

  const toggle = async () => {
    const nuevoValor = !marcado
    setMarcado(nuevoValor)
    setCargando(true)
    try {
      const res = await fetch(`/api/productos/${id}/marcado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcado: nuevoValor }),
      })
      if (!res.ok) throw new Error()
      toast.success(nuevoValor ? "Producto marcado" : "Producto desmarcado")
    } catch {
      setMarcado(!nuevoValor)
      toast.error("No se pudo actualizar")
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={cargando}
      style={{
        padding: "12px 24px",
        fontSize: "11px",
        fontFamily: "'Jost', sans-serif",
        fontWeight: 400,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        backgroundColor: marcado ? "#dceeff" : "transparent",
        color: marcado ? "#2563a8" : "var(--color-texto)",
        border: marcado ? "0.5px solid #4a90d9" : "0.5px solid var(--color-texto)",
        cursor: cargando ? "wait" : "pointer",
        borderRadius: 0,
        opacity: cargando ? 0.6 : 1,
        width: "100%",
      }}
    >
      {marcado ? "✓ Marcado" : "Marcar producto"}
    </button>
  )
}
