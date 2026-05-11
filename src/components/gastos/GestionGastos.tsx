"use client"

import { useState, useEffect, useCallback } from "react"
import ModalGasto, { type Gasto } from "./ModalGasto"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"

const CATEGORIA_LABELS: Record<string, string> = {
  INSUMOS:   "Insumos",
  PACKAGING: "Packaging",
  LOGISTICA: "Logística",
  FERIA:     "Feria",
  OTROS:     "Otros",
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const HOY = new Date()
const ANIO_ACTUAL = HOY.getFullYear()
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2]

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
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

const estiloSelect: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: "12px",
  fontFamily: "'Jost', sans-serif",
  border: "0.5px solid var(--color-borde)",
  borderRadius: 0,
  backgroundColor: "var(--color-card)",
  color: "var(--color-texto)",
  outline: "none",
  appearance: "none" as const,
  cursor: "pointer",
}

const estiloTd: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
}

export default function GestionGastos() {
  const [mes, setMes] = useState(HOY.getMonth())
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [filtroCategoria, setFiltroCategoria] = useState("")

  const [gastos, setGastos] = useState<Gasto[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null)

  const [eliminando, setEliminando] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const { esMobile } = useTamanioPantalla()

  const fetchGastos = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    const desde = new Date(anio, mes, 1).toISOString()
    const hasta = new Date(anio, mes + 1, 0, 23, 59, 59, 999).toISOString()
    try {
      const res = await fetch(
        `/api/gastos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al cargar gastos")
      setGastos(json.datos ?? [])
    } catch (e: unknown) {
      setErrorCarga(e instanceof Error ? e.message : "Error al cargar gastos")
    } finally {
      setCargando(false)
    }
  }, [mes, anio])

  useEffect(() => { fetchGastos() }, [fetchGastos])

  const abrirNuevo = () => { setEditandoGasto(null); setModalAbierto(true) }
  const abrirEditar = (gasto: Gasto) => { setEditandoGasto(gasto); setModalAbierto(true) }
  const cerrarModal = () => { setModalAbierto(false); setEditandoGasto(null) }

  const onGuardado = (guardado: Gasto) => {
    if (editandoGasto) {
      setGastos((prev) => prev.map((g) => g.id === guardado.id ? guardado : g))
    } else {
      setGastos((prev) => [guardado, ...prev])
    }
    cerrarModal()
  }

  const ejecutarEliminar = async (id: string) => {
    setProcesando(id)
    setErrorEliminar(null)
    try {
      const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar")
      setGastos((prev) => prev.filter((g) => g.id !== id))
    } catch (e: unknown) {
      setErrorEliminar(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setProcesando(null)
    }
  }

  // Filtros y totales
  const gastosFiltrados = gastos.filter((g) =>
    !filtroCategoria || g.categoria === filtroCategoria
  )

  let totalPeriodo = 0
  let totalEfectivo = 0
  let totalTransferencia = 0
  const porCategoria: Record<string, number> = {}

  for (const g of gastosFiltrados) {
    const m = Number(g.monto)
    totalPeriodo += m
    if (g.metodoPago === "EFECTIVO") totalEfectivo += m
    else if (g.metodoPago === "TRANSFERENCIA") totalTransferencia += m
    porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + m
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER + FILTROS */}
      <div style={{
        display: "flex",
        flexDirection: esMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: esMobile ? "flex-start" : "flex-end",
        gap: esMobile ? "12px" : "24px",
      }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, letterSpacing: "0.05em", color: "var(--color-texto)", margin: 0 }}>
            Gastos
          </h1>
          <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", marginTop: "6px", letterSpacing: "0.05em" }}>
            {MESES[mes]} {anio}
          </p>
        </div>
        <div style={{
          display: "flex",
          flexDirection: esMobile ? "column" : "row",
          gap: esMobile ? "10px" : "8px",
          alignItems: esMobile ? "stretch" : "flex-end",
          width: esMobile ? "100%" : undefined,
        }}>
          <div>
            <label style={estiloLabel}>Categoría</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ ...estiloSelect, width: esMobile ? "100%" : undefined }}>
              <option value="">Todas</option>
              {Object.entries(CATEGORIA_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={estiloLabel}>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={{ ...estiloSelect, width: esMobile ? "100%" : undefined }}>
              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={estiloLabel}>Año</label>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={{ ...estiloSelect, width: esMobile ? "100%" : undefined }}>
              {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            onClick={abrirNuevo}
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
              alignSelf: esMobile ? undefined : "flex-end",
              width: esMobile ? "100%" : undefined,
            }}
          >
            + Nuevo gasto
          </button>
        </div>
      </div>

      {/* TOTALES */}
      <div style={{ display: "grid", gridTemplateColumns: esMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px" }}>
        {([
          { label: "Total período",  valor: `$${totalPeriodo.toLocaleString("es-AR")}` },
          { label: "Efectivo",       valor: `$${totalEfectivo.toLocaleString("es-AR")}` },
          { label: "Transferencia",  valor: `$${totalTransferencia.toLocaleString("es-AR")}` },
          { label: "Gastos",         valor: String(gastosFiltrados.length) },
        ] as const).map(({ label, valor }) => (
          <div key={label} style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "16px 20px" }}>
            <p style={{ fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", margin: "0 0 8px" }}>
              {label}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 400, color: "var(--color-texto)", margin: 0 }}>
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* DESGLOSE POR CATEGORÍA */}
      {Object.keys(porCategoria).length > 0 && (
        <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "16px 24px" }}>
          <p style={{ fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", margin: "0 0 12px" }}>
            Por categoría
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {Object.entries(porCategoria)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => (
                <div key={cat}>
                  <p style={{ fontSize: "9px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-texto-muted)", margin: "0 0 3px" }}>
                    {CATEGORIA_LABELS[cat] ?? cat}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 400, color: "var(--color-texto)", margin: 0 }}>
                    ${total.toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ERROR ELIMINAR */}
      {errorEliminar && (
        <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", padding: "10px 14px", border: "0.5px solid var(--color-acento)", backgroundColor: "#fdf5f3", margin: 0 }}>
          {errorEliminar}
        </p>
      )}

      {/* LISTA / TABLA */}
      {cargando ? (
        <p style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>Cargando...</p>
      ) : errorCarga ? (
        <p style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", margin: 0 }}>{errorCarga}</p>
      ) : gastosFiltrados.length === 0 ? (
        <p style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>No hay gastos en este período.</p>
      ) : esMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {gastosFiltrados.map((gasto) => {
            const esEliminando = eliminando === gasto.id
            const esProcesando = procesando === gasto.id
            const estiloBoton: React.CSSProperties = { padding: "6px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 0, cursor: "pointer", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)" }
            return (
              <div key={gasto.id} style={{ backgroundColor: esEliminando ? "var(--color-superficie)" : "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "14px 16px" } as React.CSSProperties}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>{formatFecha(gasto.fecha)}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "var(--color-texto)" }}>${Number(gasto.monto).toLocaleString("es-AR")}</span>
                </div>
                <p style={{ fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: "0 0 2px" }}>{gasto.descripcion}</p>
                {gasto.notas && <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: "0 0 6px" }}>{gasto.notas}</p>}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.06em", color: "var(--color-texto-muted)" }}>{CATEGORIA_LABELS[gasto.categoria] ?? gasto.categoria}</span>
                  <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>{gasto.metodoPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</span>
                </div>
                {esEliminando ? (
                  <div style={{ borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", margin: "0 0 8px" }}>¿Eliminar este gasto?</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => ejecutarEliminar(gasto.id)} disabled={esProcesando} style={{ ...estiloBoton, border: "0.5px solid var(--color-acento)", color: "var(--color-acento)", opacity: esProcesando ? 0.4 : 1 }}>
                        {esProcesando ? "Eliminando..." : "Confirmar"}
                      </button>
                      <button onClick={() => setEliminando(null)} disabled={esProcesando} style={{ ...estiloBoton, opacity: esProcesando ? 0.4 : 1 }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <button onClick={() => abrirEditar(gasto)} style={{ ...estiloBoton, border: "0.5px solid var(--color-texto)", color: "var(--color-texto)" }}>Editar</button>
                    <button onClick={() => { setErrorEliminar(null); setEliminando(gasto.id) }} style={estiloBoton}>Eliminar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Fecha", "Descripción", "Categoría", "Método", "Monto", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map((gasto) => {
                const esEliminando = eliminando === gasto.id
                const esProcesando = procesando === gasto.id
                return (
                  <tr key={gasto.id} style={{ borderBottom: "0.5px solid var(--color-borde)", backgroundColor: esEliminando ? "var(--color-superficie)" : "transparent" }}>
                    <td style={estiloTd}><span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", whiteSpace: "nowrap" }}>{formatFecha(gasto.fecha)}</span></td>
                    <td style={{ ...estiloTd, maxWidth: "240px" }}>
                      <span style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={gasto.descripcion}>{gasto.descripcion}</span>
                      {gasto.notas && <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={gasto.notas}>{gasto.notas}</span>}
                    </td>
                    <td style={estiloTd}><span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.06em", color: "var(--color-texto-muted)" }}>{CATEGORIA_LABELS[gasto.categoria] ?? gasto.categoria}</span></td>
                    <td style={estiloTd}><span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>{gasto.metodoPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</span></td>
                    <td style={estiloTd}><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 400, color: "var(--color-texto)", whiteSpace: "nowrap" }}>${Number(gasto.monto).toLocaleString("es-AR")}</span></td>
                    <td style={{ ...estiloTd, whiteSpace: "nowrap" }}>
                      {esEliminando ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", whiteSpace: "nowrap" }}>¿Eliminar?</span>
                          {esProcesando ? <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.08em" }}>Eliminando...</span> : (
                            <button onClick={() => ejecutarEliminar(gasto.id)} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-acento)", backgroundColor: "transparent", color: "var(--color-acento)", cursor: "pointer", borderRadius: 0 }}>Confirmar</button>
                          )}
                          <button onClick={() => setEliminando(null)} disabled={esProcesando} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: esProcesando ? "not-allowed" : "pointer", borderRadius: 0, opacity: esProcesando ? 0.4 : 1 }}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => abrirEditar(gasto)} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-texto)", backgroundColor: "transparent", color: "var(--color-texto)", cursor: "pointer", borderRadius: 0 }}>Editar</button>
                          <button onClick={() => { setErrorEliminar(null); setEliminando(gasto.id) }} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: "pointer", borderRadius: 0 }}>Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <ModalGasto
          gasto={editandoGasto}
          onCerrar={cerrarModal}
          onGuardado={onGuardado}
        />
      )}
    </div>
  )
}
