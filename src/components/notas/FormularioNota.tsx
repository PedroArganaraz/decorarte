"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  nota?: {
    id: number
    titulo: string
    descripcion: string | null
  }
}

export default function FormularioNota({ nota }: Props) {
  const router = useRouter()
  const esEdicion = !!nota

  const [form, setForm] = useState({
    titulo: nota?.titulo ?? "",
    descripcion: nota?.descripcion ?? "",
  })
  const [cargando, setCargando] = useState(false)

  const estiloLabel: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-texto-muted)",
    display: "block",
    marginBottom: "6px",
  }

  const estiloInput: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-fondo)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    width: "100%",
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const url = esEdicion ? `/api/notas/${nota.id}` : "/api/notas"
    const metodo = esEdicion ? "PUT" : "POST"

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo,
        descripcion: form.descripcion || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al guardar la nota")
      setCargando(false)
      return
    }

    toast.success(esEdicion ? "Nota actualizada" : "Nota creada")
    router.push("/panel/notas")
    router.refresh()
  }

  return (
    <form id="formulario-nota" onSubmit={manejarEnvio}>
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        <div>
          <label style={estiloLabel}>Título *</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
            required
            placeholder="Título de la nota"
            style={estiloInput}
          />
        </div>

        <div>
          <label style={estiloLabel}>Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            rows={12}
            placeholder="Escribí el contenido de la nota..."
            style={{ ...estiloInput, resize: "vertical" }}
          />
        </div>
      </div>

      {cargando && (
        <p style={{
          fontSize: "11px",
          color: "var(--color-texto-muted)",
          marginTop: "12px",
          textAlign: "right",
          fontFamily: "'Jost', sans-serif",
          letterSpacing: "0.08em",
        }}>
          Guardando...
        </p>
      )}
    </form>
  )
}
