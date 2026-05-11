"use client"

import { useState, useEffect, useCallback } from "react"
import ModalEditarVenta, { type VentaParaEditar } from "./ModalEditarVenta"

interface ItemVenta {
  id: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  producto: { id: string; nombre: string; slug: string }
}

type EstadoVenta = "PAGADO" | "ENTREGADO" | "PAGADO_Y_ENTREGADO" | "REGALO" | "PENDIENTE"

interface Venta {
  id: string
  fecha: string
  cliente: string | null
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null
  estado: EstadoVenta
  esRegalo: boolean
  notas: string | null
  items: ItemVenta[]
  vendedor: { nombre: string } | null
}

const ESTADO_LABELS: Record<string, string> = {
  PAGADO_Y_ENTREGADO: "Pagado y entregado",
  PAGADO: "Pagado",
  ENTREGADO: "Entregado",
  PENDIENTE: "Pendiente",
  REGALO: "Regalo",
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const HOY = new Date()
const ANIO_ACTUAL = HOY.getFullYear()
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2]

function sumarVenta(venta: Venta) {
  return venta.items.reduce((s, i) => s + Number(i.precioTotal), 0)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function HistorialVentas() {
  const [mes, setMes] = useState(HOY.getMonth())
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [filtroMetodo, setFiltroMetodo] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")

  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [anulando, setAnulando] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [errorAnular, setErrorAnular] = useState<string | null>(null)

  const [editandoVenta, setEditandoVenta] = useState<Venta | null>(null)

  const fetchVentas = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    const desde = new Date(anio, mes, 1).toISOString()
    const hasta = new Date(anio, mes + 1, 0, 23, 59, 59, 999).toISOString()
    try {
      const res = await fetch(
        `/api/ventas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al cargar ventas")
      setVentas(json.datos ?? [])
    } catch (e: unknown) {
      setErrorCarga(e instanceof Error ? e.message : "Error al cargar ventas")
    } finally {
      setCargando(false)
    }
  }, [mes, anio])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  const ejecutarAnular = async (id: string) => {
    setProcesando(id)
    setErrorAnular(null)
    try {
      const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al anular la venta")
      setVentas((prev) => prev.filter((v) => v.id !== id))
    } catch (e: unknown) {
      setErrorAnular(e instanceof Error ? e.message : "Error al anular")
    } finally {
      setProcesando(null)
    }
  }

  const ventasFiltradas = ventas.filter((v) => {
    if (filtroMetodo && v.metodoPago !== filtroMetodo) return false
    if (filtroEstado && v.estado !== filtroEstado) return false
    return true
  })

  let totalPeriodo = 0
  let totalEfectivo = 0
  let totalTransferencia = 0
  for (const v of ventasFiltradas) {
    const t = sumarVenta(v)
    totalPeriodo += t
    if (v.metodoPago === "EFECTIVO") totalEfectivo += t
    else if (v.metodoPago === "TRANSFERENCIA") totalTransferencia += t
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* FILTROS */}
      <div style={{
        display: "flex",
        gap: "20px",
        alignItems: "flex-end",
        flexWrap: "wrap",
        marginBottom: "20px",
      }}>
        <div>
          <label style={estiloLabel}>Mes</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={estiloSelect}>
            {MESES.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={estiloLabel}>Año</label>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={estiloSelect}>
            {ANIOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ width: "1px", height: "32px", backgroundColor: "var(--color-borde)", flexShrink: 0 }} />

        <div>
          <label style={estiloLabel}>Método de pago</label>
          <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} style={estiloSelect}>
            <option value="">Todos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>

        <div>
          <label style={estiloLabel}>Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={estiloSelect}>
            <option value="">Todos</option>
            <option value="PAGADO_Y_ENTREGADO">Pagado y entregado</option>
            <option value="PAGADO">Pagado</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="REGALO">Regalo</option>
          </select>
        </div>
      </div>

      {/* TOTALES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
      }}>
        {([
          { label: "Total período", valor: `$${totalPeriodo.toLocaleString("es-AR")}` },
          { label: "Efectivo", valor: `$${totalEfectivo.toLocaleString("es-AR")}` },
          { label: "Transferencia", valor: `$${totalTransferencia.toLocaleString("es-AR")}` },
          { label: "Transacciones", valor: String(ventasFiltradas.length) },
        ] as const).map(({ label, valor }) => (
          <div key={label} style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "16px 20px",
          }}>
            <p style={{
              fontSize: "9px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
              margin: "0 0 8px",
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              fontWeight: 400,
              color: "var(--color-texto)",
              margin: 0,
            }}>
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* ERROR ANULAR */}
      {errorAnular && (
        <p style={{
          fontSize: "11px",
          fontFamily: "'Jost', sans-serif",
          color: "var(--color-acento)",
          padding: "10px 14px",
          border: "0.5px solid var(--color-acento)",
          backgroundColor: "#fdf5f3",
          margin: 0,
        }}>
          {errorAnular}
        </p>
      )}

      {/* TABLA */}
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        overflowX: "auto",
      }}>
        {cargando ? (
          <p style={{
            padding: "40px 24px",
            textAlign: "center",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto-sutil)",
            margin: 0,
          }}>
            Cargando...
          </p>
        ) : errorCarga ? (
          <p style={{
            padding: "40px 24px",
            textAlign: "center",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-acento)",
            margin: 0,
          }}>
            {errorCarga}
          </p>
        ) : ventasFiltradas.length === 0 ? (
          <p style={{
            padding: "40px 24px",
            textAlign: "center",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto-sutil)",
            margin: 0,
          }}>
            No hay ventas en este período.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Fecha", "Cliente", "Productos", "Método", "Estado", "Total", ""].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "9px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--color-texto-muted)",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((venta) => {
                const esConfirmando = anulando === venta.id
                const esProcesando = procesando === venta.id
                const total = sumarVenta(venta)
                const resumenItems = venta.items
                  .map((i) => `${i.cantidad}× ${i.producto.nombre}`)
                  .join(", ")
                const estadoLabel =
                  ESTADO_LABELS[venta.estado] ?? venta.estado

                return (
                  <tr
                    key={venta.id}
                    style={{
                      borderBottom: "0.5px solid var(--color-borde)",
                      backgroundColor: esConfirmando
                        ? "var(--color-superficie)"
                        : "transparent",
                    }}
                  >
                    <td style={estiloTd}>
                      <span style={{
                        fontSize: "12px",
                        fontFamily: "'Jost', sans-serif",
                        color: "var(--color-texto)",
                        whiteSpace: "nowrap",
                      }}>
                        {formatFecha(venta.fecha)}
                      </span>
                    </td>

                    <td style={estiloTd}>
                      <span style={{
                        fontSize: "12px",
                        fontFamily: "'Jost', sans-serif",
                        color: venta.cliente
                          ? "var(--color-texto)"
                          : "var(--color-texto-sutil)",
                      }}>
                        {venta.cliente ?? "—"}
                      </span>
                    </td>

                    <td style={{ ...estiloTd, maxWidth: "260px" }}>
                      <span style={{
                        fontSize: "12px",
                        fontFamily: "'Jost', sans-serif",
                        color: "var(--color-texto)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                        title={resumenItems}
                      >
                        {resumenItems}
                      </span>
                    </td>

                    <td style={estiloTd}>
                      <span style={{
                        fontSize: "11px",
                        fontFamily: "'Jost', sans-serif",
                        color: "var(--color-texto-muted)",
                      }}>
                        {venta.metodoPago === "EFECTIVO"
                          ? "Efectivo"
                          : venta.metodoPago === "TRANSFERENCIA"
                          ? "Transferencia"
                          : "—"}
                      </span>
                    </td>

                    <td style={estiloTd}>
                      <span style={{
                        fontSize: "10px",
                        fontFamily: "'Jost', sans-serif",
                        letterSpacing: "0.06em",
                        color: venta.estado === "PENDIENTE"
                          ? "var(--color-acento)"
                          : "var(--color-texto-muted)",
                      }}>
                        {estadoLabel}
                        {venta.esRegalo && venta.estado !== "REGALO" && " · regalo"}
                      </span>
                    </td>

                    <td style={estiloTd}>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "17px",
                        fontWeight: 400,
                        color: "var(--color-texto)",
                        whiteSpace: "nowrap",
                      }}>
                        ${total.toLocaleString("es-AR")}
                      </span>
                    </td>

                    <td style={{ ...estiloTd, whiteSpace: "nowrap" }}>
                      {esConfirmando ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontFamily: "'Jost', sans-serif",
                            color: "var(--color-acento)",
                            whiteSpace: "nowrap",
                          }}>
                            ¿Anular? Se restaura el stock.
                          </span>
                          {esProcesando ? (
                            <span style={{
                              fontSize: "11px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.08em",
                              color: "var(--color-texto-muted)",
                            }}>
                              Anulando...
                            </span>
                          ) : (
                            <button
                              onClick={() => ejecutarAnular(venta.id)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "10px",
                                fontFamily: "'Jost', sans-serif",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                border: "0.5px solid var(--color-acento)",
                                backgroundColor: "transparent",
                                color: "var(--color-acento)",
                                cursor: "pointer",
                                borderRadius: 0,
                              }}
                            >
                              Confirmar
                            </button>
                          )}
                          <button
                            onClick={() => setAnulando(null)}
                            disabled={esProcesando}
                            style={{
                              padding: "4px 10px",
                              fontSize: "10px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              border: "0.5px solid var(--color-borde)",
                              backgroundColor: "transparent",
                              color: "var(--color-texto-muted)",
                              cursor: esProcesando ? "not-allowed" : "pointer",
                              borderRadius: 0,
                              opacity: esProcesando ? 0.4 : 1,
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => setEditandoVenta(venta)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "10px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              border: "0.5px solid var(--color-texto)",
                              backgroundColor: "transparent",
                              color: "var(--color-texto)",
                              cursor: "pointer",
                              borderRadius: 0,
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setErrorAnular(null)
                              setAnulando(venta.id)
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: "10px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              border: "0.5px solid var(--color-borde)",
                              backgroundColor: "transparent",
                              color: "var(--color-texto-muted)",
                              cursor: "pointer",
                              borderRadius: 0,
                            }}
                          >
                            Anular
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {editandoVenta && (
        <ModalEditarVenta
          venta={editandoVenta as VentaParaEditar}
          onCerrar={() => setEditandoVenta(null)}
          onGuardada={(actualizada) => {
            setVentas((prev) =>
              prev.map((v) =>
                v.id === actualizada.id
                  ? { ...v, ...actualizada, estado: actualizada.estado as EstadoVenta, vendedor: v.vendedor }
                  : v
              )
            )
            setEditandoVenta(null)
          }}
        />
      )}
    </div>
  )
}
