"use client"

import { useState } from "react"

export interface Gasto {
  id: string
  descripcion: string
  monto: number
  categoria: string
  metodoPago: "EFECTIVO" | "TRANSFERENCIA"
  fecha: string
  creadoEn?: string
  notas: string | null
}

interface Props {
  gasto: Gasto | null
  onCerrar: () => void
  onGuardado: (gasto: Gasto) => void
}

const CATEGORIAS_OPERATIVAS = [
  { value: "INSUMOS",   label: "Insumos" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "FERIA",     label: "Feria" },
  { value: "OTROS",     label: "Otros" },
]

const METODOS_PAGO = [
  { value: "EFECTIVO",      label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
]

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

export default function ModalGasto({ gasto, onCerrar, onGuardado }: Props) {
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? "")
  const [monto, setMonto] = useState(gasto ? String(Number(gasto.monto)) : "")
  const [categoria, setCategoria] = useState(gasto?.categoria ?? "")
  const [metodoPago, setMetodoPago] = useState(gasto?.metodoPago ?? "")
  const [fecha, setFecha] = useState(gasto ? isoAFechaInput(gasto.fecha) : fechaHoyLocal())
  const [notas, setNotas] = useState(gasto?.notas ?? "")

  const [montoFocused, setMontoFocused] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    const montoNum = parseFloat(monto)
    if (!descripcion.trim()) { setError("Ingresá una descripción."); return }
    if (isNaN(montoNum) || montoNum <= 0) { setError("Ingresá un monto válido."); return }
    if (!categoria) { setError("Seleccioná una categoría."); return }
    if (!metodoPago) { setError("Seleccioná el método de pago."); return }

    setError(null)
    setGuardando(true)
    try {
      const url = gasto ? `/api/gastos/${gasto.id}` : "/api/gastos"
      const method = gasto ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: descripcion.trim(),
          monto: montoNum,
          categoria,
          metodoPago,
          fecha,
          notas: notas.trim() || undefined,
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
        width: "min(480px, 95vw)",
        maxHeight: "90vh",
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
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            {gasto ? "Editar gasto" : "Nuevo gasto"}
          </h2>
          <button
            onClick={onCerrar}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-texto-muted)", padding: "4px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={estiloLabel}>Descripción *</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder=""
              style={estiloInput}
              autoFocus
            />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={estiloLabel}>Categoría *</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={estiloInput}>
                <option value="">Seleccioná...</option>
                <optgroup label="Gastos operativos">
                  {CATEGORIAS_OPERATIVAS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Capital">
                  <option value="RETIRO">Retiro</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label style={estiloLabel}>Método de pago *</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={estiloInput}>
                <option value="">Seleccioná...</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={estiloLabel}>Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones..."
              rows={3}
              style={{ ...estiloInput, resize: "vertical", fontFamily: "'Jost', sans-serif" }}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 28px", borderTop: "0.5px solid var(--color-borde)", flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
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
              {guardando ? "Guardando..." : gasto ? "Guardar cambios" : "Registrar gasto"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
