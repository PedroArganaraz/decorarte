"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { Prisma } from "@prisma/client"
type Material = Prisma.MaterialGetPayload<{}>

interface Props {
  categoriaId: string
  categoriaNombre: string
  onCambio?: (cantidad: number) => void
}

export default function GestionMateriales({ categoriaId, categoriaNombre, onCambio }: Props) {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [nuevoMaterial, setNuevoMaterial] = useState("")
  const [cargando, setCargando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/materiales?categoriaId=${categoriaId}`)
      .then((res) => res.json())
      .then((data) => setMateriales(data.datos ?? []))
  }, [categoriaId])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoMaterial.trim()) return
    setCargando(true)

    const res = await fetch("/api/materiales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoMaterial.trim(), categoriaId }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al agregar material")
      setCargando(false)
      return
    }

    setMateriales((prev) => [...prev, data.datos])
    onCambio?.(materiales.length + 1)
    setNuevoMaterial("")
    toast.success("Material agregado")
    setCargando(false)
  }

  const eliminar = async (id: string) => {
    setEliminando(id)
    const res = await fetch(`/api/materiales/${id}`, { method: "DELETE" })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al eliminar")
      setEliminando(null)
      return
    }

    setMateriales((prev) => prev.filter((m: Material) => m.id !== id))
    onCambio?.(materiales.length - 1)
    toast.success("Material eliminado")
    setEliminando(null)
  }

  const estiloInput = {
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    flex: 1,
  } as React.CSSProperties

  return (
    <div style={{
      marginTop: "16px",
      padding: "16px",
      backgroundColor: "var(--color-superficie)",
      border: "0.5px solid var(--color-borde)",
    }}>
      <p style={{
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-texto-muted)",
        marginBottom: "12px",
      }}>
        Materiales de {categoriaNombre}
      </p>

      {materiales.length === 0 ? (
        <p style={{
          fontSize: "12px",
          color: "var(--color-texto-sutil)",
          marginBottom: "12px",
          letterSpacing: "0.03em",
        }}>
          No hay materiales cargados todavía
        </p>
      ) : (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}>
          {materiales.map((m: Material) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                backgroundColor: "var(--color-card)",
                border: "0.5px solid var(--color-borde)",
                fontSize: "12px",
                color: "var(--color-texto)",
              }}
            >
              <span>{m.nombre}</span>
              <button
                onClick={() => eliminar(m.id)}
                disabled={eliminando === m.id}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: eliminando === m.id ? "not-allowed" : "pointer",
                  color: "var(--color-texto-sutil)",
                  fontSize: "14px",
                  lineHeight: 1,
                  padding: "0 2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={agregar} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={nuevoMaterial}
          onChange={(e) => setNuevoMaterial(e.target.value)}
          placeholder="Ej: Acero dorado"
          style={estiloInput}
        />
        <button
          type="submit"
          disabled={cargando || !nuevoMaterial.trim()}
          style={{
            padding: "8px 16px",
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: cargando ? "var(--color-texto-muted)" : "var(--color-texto)",
            color: "var(--color-fondo)",
            border: "none",
            borderRadius: 0,
            cursor: cargando ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + Agregar
        </button>
      </form>
    </div>
  )
}
