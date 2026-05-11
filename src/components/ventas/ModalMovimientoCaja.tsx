"use client"

import { useState } from "react"

export interface MovimientoCaja {
  id: string
  fecha: string
  tipo: string
  descripcion: string | null
  monto: number
  metodoPago: string | null
  ventaId: string | null
  creadoEn: string
}

const TIPOS = [
  { value: "VUELTO",     label: "Vuelto" },
  { value: "TRANS_A_EF", label: "Transferencia → Efectivo" },
  { value: "EF_A_TRANS", label: "Efectivo → Transferencia" },
]

export const TIPO_LABELS: Record<string, string> = {
  VUELTO:     "Vuelto",
  TRANS_A_EF: "Transferencia → Efectivo",
  EF_A_TRANS: "Efectivo → Transferencia",
}

interface Props {
  movimiento: MovimientoCaja | null
  onCerrar: () => void
  onGuardado: (m: MovimientoCaja) => void
}

function fechaHoyLocal() {
  return new Date().toLocaleDateString("en-CA")
}

function isoAFechaInput(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA")
}

const estiloLabel: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-texto-muted)",
  marginBottom: "5px",
  display: "block",
}

const estiloInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: "13px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 400,
  border: "0.5px solid var(--color-borde)",
  borderRadius: 0,
  backgroundColor: "var(--color-card)",
  color: "var(--color-texto)",
  outline: "none",
  boxSizing: "border-box",
  appearance: "none" as const,
}

export default function ModalMovimientoCaja({ movimiento, onCerrar, onGuardado }: Props) {
  const [tipo, setTipo] = useState(movimiento?.tipo ?? "TRANS_A_EF")
  const [monto, setMonto] = useState(movimiento ? String(Number(movimiento.monto)) : "")
  const [descripcion, setDescripcion] = useState(movimiento?.descripcion ?? "")
  const [fecha, setFecha] = useState(movimiento ? isoAFechaInput(movimiento.fecha) : fechaHoyLocal())
  const [montoFocused, setMontoFocused] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) { setError("Ingresá un monto válido."); return }
    if (!tipo) { setError("Seleccioná un tipo."); return }

    setError(null)
    setGuardando(true)
    try {
      const url = movimiento ? `/api/movimientos-caja/${movimiento.id}` : "/api/movimientos-caja"
      const method = movimiento ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          monto: montoNum,
          descripcion: descripcion.trim() || undefined,
          fecha,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al guardar")
      onGuardado(json.datos)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div
        onClick={onCerrar}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(44, 44, 42, 0.3)",
          zIndex: 100,
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
        width: "min(440px, 95vw)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px",
          borderBottom: "0.5px solid var(--color-borde)",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            {movimiento ? "Editar movimiento" : "Nuevo movimiento"}
          </h2>
          <button
            onClick={onCerrar}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-texto-muted)", padding: "4px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={estiloLabel}>Tipo *</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={estiloInput}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={estiloLabel}>Monto *</label>
              <input
                type="text"
                inputMode="decimal"
                value={montoFocused ? monto : (monto === "" || isNaN(Number(monto)) ? monto : Number(monto).toLocaleString("es-AR"))}
                onChange={(e) => setMonto(e.target.value)}
                onFocus={(e) => { setMontoFocused(true); e.target.select() }}
                onBlur={() => setMontoFocused(false)}
                placeholder="0"
                style={estiloInput}
              />
            </div>
            <div>
              <label style={estiloLabel}>Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={estiloInput}
              />
            </div>
          </div>

          <div>
            <label style={estiloLabel}>Descripción (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={estiloInput}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 28px", borderTop: "0.5px solid var(--color-borde)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {error && (
            <p style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-acento)",
              padding: "8px 12px",
              border: "0.5px solid var(--color-acento)",
              backgroundColor: "#fdf5f3",
              margin: 0,
            }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onCerrar}
              disabled={guardando}
              style={{
                flex: 1,
                padding: "11px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: "transparent",
                color: "var(--color-texto)",
                border: "0.5px solid var(--color-texto)",
                borderRadius: 0,
                cursor: guardando ? "not-allowed" : "pointer",
                opacity: guardando ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                flex: 1,
                padding: "11px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                backgroundColor: guardando ? "var(--color-texto-muted)" : "var(--color-texto)",
                color: "var(--color-card)",
                border: "none",
                borderRadius: 0,
                cursor: guardando ? "not-allowed" : "pointer",
              }}
            >
              {guardando ? "Guardando..." : movimiento ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
