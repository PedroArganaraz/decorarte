"use client"

import { useState, useEffect, useCallback } from "react"
import ModalEditarVenta, { type VentaParaEditar } from "./ModalEditarVenta"
import ModalMovimientoCaja, { type MovimientoCaja, TIPO_LABELS } from "./ModalMovimientoCaja"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"
import { SkeletonCard, SkeletonTable, SkeletonCardMobile } from "@/components/ui/skeleton"

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
  montoRecibido: number | null
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

export const ESTADO_COLORES: Record<string, string> = {
  PENDIENTE:          "var(--color-texto)",
  ENTREGADO:          "#C0392B",
  PAGADO:             "#2980B9",
  PAGADO_Y_ENTREGADO: "#27AE60",
  REGALO:             "var(--color-texto-muted)",
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

const estiloBtnPaginacion: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "11px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 400,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  backgroundColor: "transparent",
  color: "var(--color-texto)",
  border: "0.5px solid var(--color-texto)",
  borderRadius: 0,
  cursor: "pointer",
}

const estiloBtnPaginacionDeshabilitado: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "11px",
  fontFamily: "'Jost', sans-serif",
  fontWeight: 400,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  backgroundColor: "transparent",
  color: "var(--color-texto-muted)",
  border: "0.5px solid var(--color-borde)",
  borderRadius: 0,
  cursor: "not-allowed",
  opacity: 0.45,
}

export default function HistorialVentas() {
  const [mes, setMes] = useState(HOY.getMonth())
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [verAnioCompleto, setVerAnioCompleto] = useState(false)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalVentas, setTotalVentas] = useState(0)
  const [totalPaginasVentas, setTotalPaginasVentas] = useState(1)
  const [metricas, setMetricas] = useState({ totalPeriodo: 0, totalEfectivo: 0, totalTransferencia: 0 })

  const [anulando, setAnulando] = useState<string | null>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [errorAnular, setErrorAnular] = useState<string | null>(null)

  const [editandoVenta, setEditandoVenta] = useState<Venta | null>(null)

  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [cargandoMov, setCargandoMov] = useState(true)
  const [paginaMov, setPaginaMov] = useState(1)
  const [totalMov, setTotalMov] = useState(0)
  const [totalPaginasMov, setTotalPaginasMov] = useState(1)
  const [modalMovAbierto, setModalMovAbierto] = useState(false)
  const [editandoMov, setEditandoMov] = useState<MovimientoCaja | null>(null)
  const [eliminandoMov, setEliminandoMov] = useState<string | null>(null)
  const [procesandoMov, setProcesandoMov] = useState<string | null>(null)
  const [errorMov, setErrorMov] = useState<string | null>(null)

  const { esMobile } = useTamanioPantalla()

  const fetchVentas = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    const desde = verAnioCompleto
      ? new Date(anio, 0, 1).toISOString()
      : new Date(anio, mes, 1).toISOString()
    const hasta = verAnioCompleto
      ? new Date(anio, 11, 31, 23, 59, 59, 999).toISOString()
      : new Date(anio, mes + 1, 0, 23, 59, 59, 999).toISOString()
    try {
      const res = await fetch(
        `/api/ventas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&page=${pagina}&limit=20`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al cargar ventas")
      setVentas(json.datos ?? [])
      setTotalVentas(json.total ?? 0)
      setTotalPaginasVentas(json.totalPaginas ?? 1)
      setMetricas({
        totalPeriodo: json.metricas?.totalPeriodo ?? 0,
        totalEfectivo: json.metricas?.totalEfectivo ?? 0,
        totalTransferencia: json.metricas?.totalTransferencia ?? 0,
      })
    } catch (e: unknown) {
      setErrorCarga(e instanceof Error ? e.message : "Error al cargar ventas")
    } finally {
      setCargando(false)
    }
  }, [mes, anio, verAnioCompleto, pagina])

  const fetchMovimientos = useCallback(async () => {
    setCargandoMov(true)
    const desde = verAnioCompleto
      ? new Date(anio, 0, 1).toISOString()
      : new Date(anio, mes, 1).toISOString()
    const hasta = verAnioCompleto
      ? new Date(anio, 11, 31, 23, 59, 59, 999).toISOString()
      : new Date(anio, mes + 1, 0, 23, 59, 59, 999).toISOString()
    try {
      const res = await fetch(`/api/movimientos-caja?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&page=${paginaMov}&limit=10`)
      const json = await res.json()
      setMovimientos(json.datos ?? [])
      setTotalMov(json.total ?? 0)
      setTotalPaginasMov(json.totalPaginas ?? 1)
    } catch {
      // silently fail
    } finally {
      setCargandoMov(false)
    }
  }, [mes, anio, verAnioCompleto, paginaMov])

  useEffect(() => { fetchVentas() }, [fetchVentas])
  useEffect(() => { fetchMovimientos() }, [fetchMovimientos])

  const ejecutarEliminarMov = async (id: string) => {
    setProcesandoMov(id)
    setErrorMov(null)
    try {
      const res = await fetch(`/api/movimientos-caja/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar")
      setMovimientos((prev) => prev.filter((m) => m.id !== id))
      fetchVentas()
    } catch (e: unknown) {
      setErrorMov(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setProcesandoMov(null)
      setEliminandoMov(null)
    }
  }

  const ejecutarAnular = async (id: string) => {
    setProcesando(id)
    setErrorAnular(null)
    try {
      const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al anular la venta")
      setVentas((prev) => prev.filter((v) => v.id !== id))
      setMovimientos((prev) => prev.filter((m) => m.ventaId !== id))
    } catch (e: unknown) {
      setErrorAnular(e instanceof Error ? e.message : "Error al anular")
    } finally {
      setProcesando(null)
    }
  }

  const ventasFiltradas = ventas

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
            Ventas
          </h1>
          <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", marginTop: "6px", letterSpacing: "0.05em" }}>
            {verAnioCompleto ? String(anio) : `${MESES[mes]} ${anio}`}
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
            <label style={estiloLabel}>Mes</label>
            <select
              value={mes}
              onChange={(e) => { setMes(Number(e.target.value)); setVerAnioCompleto(false); setPagina(1); setPaginaMov(1) }}
              disabled={verAnioCompleto}
              style={{ ...estiloSelect, width: esMobile ? "100%" : undefined, opacity: verAnioCompleto ? 0.4 : 1 }}
            >
              {MESES.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={estiloLabel}>Año</label>
            <select value={anio} onChange={(e) => { setAnio(Number(e.target.value)); setPagina(1); setPaginaMov(1) }} style={{ ...estiloSelect, width: esMobile ? "100%" : undefined }}>
              {ANIOS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setVerAnioCompleto((v) => !v); setPagina(1); setPaginaMov(1) }}
            style={{
              padding: "8px 14px",
              fontSize: "10px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: verAnioCompleto ? 500 : 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "0.5px solid var(--color-texto)",
              backgroundColor: verAnioCompleto ? "var(--color-texto)" : "transparent",
              color: verAnioCompleto ? "var(--color-card)" : "var(--color-texto)",
              cursor: "pointer",
              borderRadius: 0,
              width: esMobile ? "100%" : undefined,
            }}
          >
            {verAnioCompleto ? "Ver mes" : "Ver año completo"}
          </button>
          <a
            href="/ventas/nueva"
            style={{
              padding: "10px 20px",
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              backgroundColor: "var(--color-texto)",
              color: "var(--color-fondo)",
              textDecoration: "none",
              display: "block",
              width: esMobile ? "100%" : undefined,
              boxSizing: "border-box",
              textAlign: "center",
              alignSelf: esMobile ? undefined : "flex-end",
            }}
          >
            + Nueva venta
          </a>
        </div>
      </div>

      {/* TOTALES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: esMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: "12px",
      }}>
        {cargando ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          ([
            { label: "Total período", valor: `$${metricas.totalPeriodo.toLocaleString("es-AR")}` },
            { label: "Efectivo", valor: `$${metricas.totalEfectivo.toLocaleString("es-AR")}` },
            { label: "Transferencia", valor: `$${metricas.totalTransferencia.toLocaleString("es-AR")}` },
            { label: "Transacciones", valor: String(totalVentas) },
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
          ))
        )}
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

      {/* LISTA / TABLA */}
      {cargando ? (
        esMobile
          ? <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{[0,1,2,3,4].map((i) => <SkeletonCardMobile key={i} />)}</div>
          : <SkeletonTable cols={[55, 30, 70, 30, 35, 20, 0]} filas={5} />
      ) : errorCarga ? (
        <p style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", margin: 0 }}>{errorCarga}</p>
      ) : ventasFiltradas.length === 0 ? (
        <p style={{ padding: "40px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>No hay ventas en este período.</p>
      ) : esMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {ventasFiltradas.map((venta) => {
            const esConfirmando = anulando === venta.id
            const esProcesando = procesando === venta.id
            const total = sumarVenta(venta)
            const resumenItems = venta.items.map((i) => `${i.cantidad}× ${i.producto.nombre}`).join(", ")
            const estadoLabel = ESTADO_LABELS[venta.estado] ?? venta.estado
            const estiloBoton: React.CSSProperties = { padding: "6px 14px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 0, cursor: "pointer", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)" }
            return (
              <div key={venta.id} style={{ backgroundColor: esConfirmando ? "var(--color-superficie)" : "var(--color-card)", border: "0.5px solid var(--color-borde)", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>{formatFecha(venta.fecha)}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "var(--color-texto)" }}>${total.toLocaleString("es-AR")}</span>
                </div>
                <p style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={resumenItems}>{resumenItems}</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {venta.cliente && <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>{venta.cliente}</span>}
                  <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.06em" }}>
                    {venta.metodoPago === "EFECTIVO" ? "Efectivo" : venta.metodoPago === "TRANSFERENCIA" ? "Transferencia" : "—"}
                  </span>
                  <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.06em", color: venta.estado === "PENDIENTE" ? "var(--color-acento)" : "var(--color-texto-muted)" }}>
                    {estadoLabel}{venta.esRegalo && venta.estado !== "REGALO" && " · regalo"}
                  </span>
                </div>
                {esConfirmando ? (
                  <div style={{ borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", margin: "0 0 8px" }}>¿Anular? Se restaura el stock.</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => ejecutarAnular(venta.id)} disabled={esProcesando} style={{ ...estiloBoton, border: "0.5px solid var(--color-acento)", color: "var(--color-acento)", opacity: esProcesando ? 0.4 : 1 }}>
                        {esProcesando ? "Anulando..." : "Confirmar"}
                      </button>
                      <button onClick={() => setAnulando(null)} disabled={esProcesando} style={{ ...estiloBoton, opacity: esProcesando ? 0.4 : 1 }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", borderTop: "0.5px solid var(--color-superficie)", paddingTop: "10px" }}>
                    <button onClick={() => setEditandoVenta(venta)} style={{ ...estiloBoton, border: "0.5px solid var(--color-texto)", color: "var(--color-texto)" }}>Editar</button>
                    <button onClick={() => { setErrorAnular(null); setAnulando(venta.id) }} style={estiloBoton}>Anular</button>
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
                {["Fecha", "Cliente", "Productos", "Método", "Estado", "Total", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", whiteSpace: "nowrap" }}>
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
                const resumenItems = venta.items.map((i) => `${i.cantidad}× ${i.producto.nombre}`).join(", ")
                const estadoLabel = ESTADO_LABELS[venta.estado] ?? venta.estado
                return (
                  <tr key={venta.id} style={{ borderBottom: "0.5px solid var(--color-borde)", backgroundColor: esConfirmando ? "var(--color-superficie)" : "transparent" }}>
                    <td style={estiloTd}><span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", whiteSpace: "nowrap" }}>{formatFecha(venta.fecha)}</span></td>
                    <td style={estiloTd}><span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: venta.cliente ? "var(--color-texto)" : "var(--color-texto-sutil)" }}>{venta.cliente ?? "—"}</span></td>
                    <td style={estiloTd}>
                      {venta.items.map((i) => (
                        <span key={i.id} style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", display: "block" }}>
                          {i.cantidad}× {i.producto.nombre}
                        </span>
                      ))}
                    </td>
                    <td style={estiloTd}><span style={{ fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)" }}>{venta.metodoPago === "EFECTIVO" ? "Efectivo" : venta.metodoPago === "TRANSFERENCIA" ? "Transferencia" : "—"}</span></td>
                    <td style={estiloTd}><span style={{ fontSize: "13px", fontFamily: "'Jost', sans-serif", color: ESTADO_COLORES[venta.estado] ?? "var(--color-texto)" }}>{estadoLabel}{venta.esRegalo && venta.estado !== "REGALO" && " · regalo"}</span></td>
                    <td style={estiloTd}><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 400, color: "var(--color-texto)", whiteSpace: "nowrap" }}>${total.toLocaleString("es-AR")}</span></td>
                    <td style={{ ...estiloTd, minWidth: "160px" }}>
                      {esConfirmando ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)" }}>¿Anular? Se restaura el stock.</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                          {esProcesando ? (
                            <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em", color: "var(--color-texto-muted)" }}>Anulando...</span>
                          ) : (
                            <button onClick={() => ejecutarAnular(venta.id)} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-acento)", backgroundColor: "transparent", color: "var(--color-acento)", cursor: "pointer", borderRadius: 0 }}>Confirmar</button>
                          )}
                          <button onClick={() => setAnulando(null)} disabled={esProcesando} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: esProcesando ? "not-allowed" : "pointer", borderRadius: 0, opacity: esProcesando ? 0.4 : 1 }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => setEditandoVenta(venta)} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-texto)", backgroundColor: "transparent", color: "var(--color-texto)", cursor: "pointer", borderRadius: 0 }}>Editar</button>
                          <button onClick={() => { setErrorAnular(null); setAnulando(venta.id) }} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-borde)", backgroundColor: "transparent", color: "var(--color-texto-muted)", cursor: "pointer", borderRadius: 0 }}>Anular</button>
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

      {/* PAGINACIÓN VENTAS */}
      {!cargando && !errorCarga && totalVentas > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {pagina <= 1 ? (
            <span style={estiloBtnPaginacionDeshabilitado}>← Anterior</span>
          ) : (
            <button onClick={() => setPagina((p) => p - 1)} style={estiloBtnPaginacion}>← Anterior</button>
          )}
          <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.06em" }}>
            Página {pagina} de {totalPaginasVentas}
            <span style={{ color: "var(--color-texto-sutil)", marginLeft: "8px" }}>({totalVentas} {totalVentas === 1 ? "venta" : "ventas"})</span>
          </span>
          {pagina >= totalPaginasVentas ? (
            <span style={estiloBtnPaginacionDeshabilitado}>Siguiente →</span>
          ) : (
            <button onClick={() => setPagina((p) => p + 1)} style={estiloBtnPaginacion}>Siguiente →</button>
          )}
        </div>
      )}

      {/* MOVIMIENTOS DE CAJA */}
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-texto)", margin: 0 }}>
            Movimientos de caja
          </h2>
          <button
            onClick={() => { setEditandoMov(null); setModalMovAbierto(true) }}
            style={{ padding: "8px 16px", fontSize: "10px", fontFamily: "'Jost', sans-serif", fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", backgroundColor: "var(--color-texto)", color: "var(--color-fondo)", border: "none", borderRadius: 0, cursor: "pointer" }}
          >
            + Nuevo movimiento
          </button>
        </div>

        {errorMov && (
          <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", padding: "10px 14px", border: "0.5px solid var(--color-acento)", backgroundColor: "#fdf5f3", margin: "0 0 12px" }}>
            {errorMov}
          </p>
        )}

        {cargandoMov ? (
          <SkeletonTable cols={[45, 30, 65, 25, 0]} filas={3} />
        ) : movimientos.length === 0 ? (
          <p style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>No hay movimientos en este período.</p>
        ) : (
          <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                  {["Fecha", "Tipo", "Descripción", "Monto", ""].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => {
                  const esEliminando = eliminandoMov === mov.id
                  const esProcesando = procesandoMov === mov.id
                  const esIngreso = mov.tipo === "INGRESO"
                  return (
                    <tr key={mov.id} style={{ borderBottom: "0.5px solid var(--color-borde)", backgroundColor: esEliminando ? "var(--color-superficie)" : esIngreso ? "#c8e6c9" : "transparent" }}>
                      <td style={estiloTd}><span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", whiteSpace: "nowrap" }}>{new Date(mov.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</span></td>
                      <td style={estiloTd}><span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: esIngreso ? "var(--color-texto)" : "var(--color-texto-muted)", letterSpacing: "0.04em" }}>{TIPO_LABELS[mov.tipo] ?? mov.tipo}</span></td>
                      <td style={{ ...estiloTd, maxWidth: "240px" }}><span style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: esIngreso ? "var(--color-texto)" : "var(--color-texto-sutil)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mov.descripcion ?? "—"}</span></td>
                      <td style={estiloTd}><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: 400, color: "var(--color-texto)", whiteSpace: "nowrap" }}>${Number(mov.monto).toLocaleString("es-AR")}</span></td>
                      <td style={{ ...estiloTd, whiteSpace: "nowrap" }}>
                        {esEliminando ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)" }}>¿Eliminar?</span>
                            {esProcesando ? (
                              <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: esIngreso ? "var(--color-texto)" : "var(--color-texto-muted)" }}>Eliminando...</span>
                            ) : (
                              <button onClick={() => ejecutarEliminarMov(mov.id)} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-acento)", backgroundColor: "transparent", color: "var(--color-acento)", cursor: "pointer", borderRadius: 0 }}>Confirmar</button>
                            )}
                            <button onClick={() => setEliminandoMov(null)} disabled={esProcesando} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: `0.5px solid ${esIngreso ? "var(--color-texto)" : "var(--color-borde)"}`, backgroundColor: "transparent", color: esIngreso ? "var(--color-texto)" : "var(--color-texto-muted)", cursor: esProcesando ? "not-allowed" : "pointer", borderRadius: 0, opacity: esProcesando ? 0.4 : 1 }}>Cancelar</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => { setEditandoMov(mov); setModalMovAbierto(true) }} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-texto)", backgroundColor: "transparent", color: "var(--color-texto)", cursor: "pointer", borderRadius: 0 }}>Editar</button>
                            <button onClick={() => { setErrorMov(null); setEliminandoMov(mov.id) }} style={{ padding: "4px 10px", fontSize: "10px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid var(--color-texto)", backgroundColor: "transparent", color: "var(--color-texto)", cursor: "pointer", borderRadius: 0 }}>Eliminar</button>
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

        {/* PAGINACIÓN MOVIMIENTOS */}
        {!cargandoMov && totalMov > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
            {paginaMov <= 1 ? (
              <span style={estiloBtnPaginacionDeshabilitado}>← Anterior</span>
            ) : (
              <button onClick={() => setPaginaMov((p) => p - 1)} style={estiloBtnPaginacion}>← Anterior</button>
            )}
            <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.06em" }}>
              Página {paginaMov} de {totalPaginasMov}
              <span style={{ color: "var(--color-texto-sutil)", marginLeft: "8px" }}>({totalMov} {totalMov === 1 ? "movimiento" : "movimientos"})</span>
            </span>
            {paginaMov >= totalPaginasMov ? (
              <span style={estiloBtnPaginacionDeshabilitado}>Siguiente →</span>
            ) : (
              <button onClick={() => setPaginaMov((p) => p + 1)} style={estiloBtnPaginacion}>Siguiente →</button>
            )}
          </div>
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
            fetchVentas()
          }}
        />
      )}

      {modalMovAbierto && (
        <ModalMovimientoCaja
          movimiento={editandoMov}
          onCerrar={() => { setModalMovAbierto(false); setEditandoMov(null) }}
          onGuardado={(guardado) => {
            if (editandoMov) {
              setMovimientos((prev) => prev.map((m) => m.id === guardado.id ? guardado : m))
            } else {
              setMovimientos((prev) => [guardado, ...prev])
            }
            setModalMovAbierto(false)
            setEditandoMov(null)
            fetchVentas()
          }}
        />
      )}
    </div>
  )
}
