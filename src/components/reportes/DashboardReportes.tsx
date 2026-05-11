"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, PieChart, Pie,
} from "recharts"

const HOY = new Date()
const ANIO_ACTUAL = HOY.getFullYear()
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2]
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const PALETA = ["#3D3835", "#7C6F65", "#A89080", "#C4B0A2", "#D8CCC4"]
const COLORES_PAGO: Record<string, string> = {
  Efectivo:      "#3D3835",
  Transferencia: "#A89080",
  "Sin método":  "#D8CCC4",
}

function truncar(str: string, max = 20): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

interface CategoriaDatos {
  categoria: string
  cantidad: number
  total: number
}

interface TopProducto {
  productoId: string
  nombre: string
  categoria: string
  unidades: number
  montoTotal: number
}

interface Resumen {
  periodo: { desde: string | null; hasta: string | null }
  ventas: {
    cantidad: number
    ingresosBrutos: number
    costoMercaderia: number
    gananciaProductos: number
    desglosePago: { efectivo: number; transferencia: number; sinMetodo: number }
    porCategoria: CategoriaDatos[]
  }
  gastos: {
    cantidad: number
    total: number
    desglosePago: { efectivo: number; transferencia: number }
    porCategoria: { categoria: string; total: number }[]
  }
  gananciaNeta: number
  topProductos: TopProducto[]
  combinacionesFrecuentes: Array<{
    producto1: { id: string; nombre: string }
    producto2: { id: string; nombre: string }
    veces: number
  }>
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

const estiloTituloSeccion: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: "18px",
  fontWeight: 400,
  letterSpacing: "0.04em",
  color: "var(--color-texto)",
  margin: "0 0 12px",
}

function fmt(n: number): string {
  return `$${n.toLocaleString("es-AR")}`
}

// Tooltip compartido para barras
function TooltipBarra({ active, payload }: { active?: boolean; payload?: Array<{ value: unknown; payload?: { label?: string; categoria?: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const etiqueta = item.payload?.label ?? item.payload?.categoria ?? ""
  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "0.5px solid var(--color-borde)",
      padding: "8px 12px",
      fontFamily: "'Jost', sans-serif",
    }}>
      {etiqueta && (
        <p style={{ fontSize: "10px", color: "var(--color-texto-muted)", margin: "0 0 3px", letterSpacing: "0.06em" }}>
          {etiqueta}
        </p>
      )}
      <p style={{ fontSize: "15px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: 0 }}>
        {fmt(Number(item.value))}
      </p>
    </div>
  )
}

// Tooltip para torta
function TooltipTorta({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: unknown }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "0.5px solid var(--color-borde)",
      padding: "8px 12px",
      fontFamily: "'Jost', sans-serif",
    }}>
      <p style={{ fontSize: "10px", color: "var(--color-texto-muted)", margin: "0 0 3px", letterSpacing: "0.06em" }}>
        {item.name}
      </p>
      <p style={{ fontSize: "15px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: 0 }}>
        {fmt(Number(item.value))}
      </p>
    </div>
  )
}

// Tooltip para top productos
function TooltipTopProductos({ active, payload }: { active?: boolean; payload?: Array<{ payload: TopProducto & { nombreCorto: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "0.5px solid var(--color-borde)",
      padding: "10px 14px",
      fontFamily: "'Jost', sans-serif",
      maxWidth: "240px",
    }}>
      <p style={{ fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: "0 0 3px" }}>
        {item.nombre}
      </p>
      <p style={{ fontSize: "10px", color: "var(--color-texto-muted)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
        {item.categoria}
      </p>
      <p style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)", margin: "0 0 2px" }}>
        {item.unidades} {item.unidades === 1 ? "unidad vendida" : "unidades vendidas"}
      </p>
      <p style={{ fontSize: "15px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", margin: 0 }}>
        {fmt(item.montoTotal)}
      </p>
    </div>
  )
}

// Etiqueta de porcentaje dentro de cada porción
function EtiquetaTorta({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number; cy?: number; midAngle?: number
  innerRadius?: number; outerRadius?: number; percent?: number
}) {
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radio = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radio * Math.cos(-midAngle * RADIAN)
  const y = cy + radio * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: "12px", fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DashboardReportes() {
  const [mes, setMes] = useState(HOY.getMonth())
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [verAnioCompleto, setVerAnioCompleto] = useState(false)
  const [datos, setDatos] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verTodosProductos, setVerTodosProductos] = useState(false)
  const [verTodosCombinaciones, setVerTodosCombinaciones] = useState(false)

  const fetchResumen = useCallback(async () => {
    setCargando(true)
    setError(null)
    const desde = verAnioCompleto
      ? new Date(anio, 0, 1).toISOString()
      : new Date(anio, mes, 1).toISOString()
    const hasta = verAnioCompleto
      ? new Date(anio, 11, 31, 23, 59, 59, 999).toISOString()
      : new Date(anio, mes + 1, 0, 23, 59, 59, 999).toISOString()
    try {
      const res = await fetch(
        `/api/reportes/resumen?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al cargar")
      setDatos(json.datos)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar")
    } finally {
      setCargando(false)
    }
  }, [mes, anio, verAnioCompleto])

  useEffect(() => {
    fetchResumen()
  }, [fetchResumen])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            Reportes
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "11px",
            color: "var(--color-texto-sutil)",
            letterSpacing: "0.08em",
            margin: "4px 0 0",
          }}>
            {verAnioCompleto ? `Año ${anio}` : `${MESES[mes]} ${anio}`}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <label style={estiloLabel}>Mes</label>
            <select
              value={mes}
              onChange={(e) => { setMes(Number(e.target.value)); setVerAnioCompleto(false) }}
              disabled={verAnioCompleto}
              style={{ ...estiloSelect, opacity: verAnioCompleto ? 0.4 : 1 }}
            >
              {MESES.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={estiloLabel}>Año</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              style={estiloSelect}
            >
              {ANIOS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setVerAnioCompleto((v) => !v)}
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
            }}
          >
            {verAnioCompleto ? "Ver mes" : "Ver año completo"}
          </button>
        </div>
      </div>

      {cargando ? (
        <p style={{
          fontSize: "13px",
          fontFamily: "'Jost', sans-serif",
          color: "var(--color-texto-sutil)",
          padding: "48px 0",
          textAlign: "center",
          margin: 0,
        }}>
          Cargando...
        </p>
      ) : error ? (
        <p style={{
          fontSize: "13px",
          fontFamily: "'Jost', sans-serif",
          color: "var(--color-acento)",
          padding: "48px 0",
          textAlign: "center",
          margin: 0,
        }}>
          {error}
        </p>
      ) : datos ? (
        <>
          {/* 4 CARDS MÉTRICAS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              { label: "Ventas brutas",    valor: datos.ventas.ingresosBrutos },
              { label: "Costo mercadería", valor: datos.ventas.costoMercaderia },
              { label: "Total gastos",     valor: datos.gastos.total },
              { label: "Ganancia neta",    valor: datos.gananciaNeta },
            ].map(({ label, valor }) => {
              const negativo = valor < 0
              return (
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
                    color: negativo ? "var(--color-acento)" : "var(--color-texto)",
                    margin: 0,
                  }}>
                    {negativo && "−"}{fmt(Math.abs(valor))}
                  </p>
                </div>
              )
            })}
          </div>

          {/* CAJA */}
          <div>
            <h2 style={estiloTituloSeccion}>Caja</h2>
            <div style={{
              backgroundColor: "var(--color-card)",
              border: "0.5px solid var(--color-borde)",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 1fr 1fr",
                borderBottom: "0.5px solid var(--color-borde)",
              }}>
                <div />
                {["Ingresos", "Gastos", "Balance"].map((h) => (
                  <div key={h} style={{ padding: "10px 16px" }}>
                    <span style={{
                      fontSize: "9px",
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 500,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--color-texto-muted)",
                    }}>
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              {[
                { label: "Efectivo",      ingresos: datos.ventas.desglosePago.efectivo,      gastos: datos.gastos.desglosePago.efectivo,      esTotal: false, esCosto: false },
                { label: "Transferencia", ingresos: datos.ventas.desglosePago.transferencia, gastos: datos.gastos.desglosePago.transferencia, esTotal: false, esCosto: false },
                { label: "Costo mercadería", ingresos: null,                                 gastos: datos.ventas.costoMercaderia,            esTotal: false, esCosto: true  },
                { label: "Total",         ingresos: datos.ventas.ingresosBrutos,             gastos: datos.gastos.total + datos.ventas.costoMercaderia, esTotal: true,  esCosto: false },
              ].map(({ label, ingresos, gastos: g, esTotal, esCosto }, idx, arr) => {
                const balance = esTotal ? datos.gananciaNeta : null
                const negativo = balance !== null && balance < 0
                return (
                  <div key={label} style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 1fr 1fr",
                    borderBottom: idx < arr.length - 1 ? "0.5px solid var(--color-borde)" : "none",
                    backgroundColor: esTotal ? "var(--color-superficie)" : "transparent",
                  }}>
                    <div style={{ padding: "12px 16px", display: "flex", alignItems: "center" }}>
                      <span style={{
                        fontSize: esTotal ? "9px" : "11px",
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: esTotal ? 500 : 400,
                        letterSpacing: esTotal ? "0.12em" : "0.04em",
                        textTransform: esTotal ? "uppercase" : "none",
                        color: "var(--color-texto-muted)",
                      }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      {ingresos !== null && (
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: esTotal ? "18px" : "16px", fontWeight: 400, color: "var(--color-texto)" }}>
                          {fmt(ingresos)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: esTotal ? "18px" : "16px", fontWeight: 400, color: esCosto ? "var(--color-acento)" : "var(--color-texto-muted)" }}>
                        {fmt(g)}
                      </span>
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      {balance !== null && (
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: esTotal ? "18px" : "16px", fontWeight: 400, color: negativo ? "var(--color-acento)" : "var(--color-texto)" }}>
                          {negativo && "−"}{fmt(Math.abs(balance))}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* GRÁFICO 1 — BARRAS VERTICALES: ventas por categoría */}
          {datos.ventas.porCategoria.length > 0 && (() => {
            const ordenadas = [...datos.ventas.porCategoria]
              .sort((a, b) => b.total - a.total)
              .map((c) => ({ ...c, label: c.categoria }))
            return (
              <div>
                <h2 style={estiloTituloSeccion}>Ventas por categoría</h2>
                <div style={{
                  backgroundColor: "var(--color-card)",
                  border: "0.5px solid var(--color-borde)",
                  padding: "20px 8px 8px",
                }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ordenadas} margin={{ top: 28, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--color-borde)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="categoria"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fill: "var(--color-texto-muted)" }}
                      />
                      <YAxis hide />
                      <Tooltip content={<TooltipBarra />} cursor={{ fill: "var(--color-superficie)" }} />
                      <Bar dataKey="total" radius={[2, 2, 0, 0]} maxBarSize={72}>
                        {ordenadas.map((_, i) => (
                          <Cell key={i} fill={PALETA[i % PALETA.length]} />
                        ))}
                        <LabelList
                          dataKey="total"
                          position="top"
                          formatter={(v: unknown) => fmt(Number(v))}
                          style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", fill: "var(--color-texto-muted)" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Leyenda por cantidad */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "4px 16px 12px", flexWrap: "wrap" }}>
                    {ordenadas.map((cat, i) => (
                      <div key={cat.categoria} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: PALETA[i % PALETA.length], flexShrink: 0 }} />
                        <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>
                          {cat.categoria} · {cat.cantidad} un.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* GRÁFICOS 2 Y 3 — en columnas */}
          {(() => {
            const pieDatos = [
              datos.ventas.desglosePago.efectivo > 0
                ? { name: "Efectivo",      value: datos.ventas.desglosePago.efectivo,      color: COLORES_PAGO["Efectivo"] }
                : null,
              datos.ventas.desglosePago.transferencia > 0
                ? { name: "Transferencia", value: datos.ventas.desglosePago.transferencia, color: COLORES_PAGO["Transferencia"] }
                : null,
              datos.ventas.desglosePago.sinMetodo > 0
                ? { name: "Sin método",    value: datos.ventas.desglosePago.sinMetodo,    color: COLORES_PAGO["Sin método"] }
                : null,
            ].filter((x): x is NonNullable<typeof x> => x !== null)

            const topData = datos.topProductos.map((p) => ({
              ...p,
              nombreCorto: truncar(p.nombre),
            }))

            const hasPie  = pieDatos.length >= 1 && datos.ventas.ingresosBrutos > 0
            const hasTop  = topData.length > 0

            if (!hasPie && !hasTop) return null

            const productosVisibles = verTodosProductos ? topData : topData.slice(0, 5)

            return (
              <div style={{
                display: "grid",
                gridTemplateColumns: hasPie && hasTop ? "1fr 1fr" : "1fr",
                gap: "24px",
                alignItems: "stretch",
              }}>

                {/* GRÁFICO 2 — TORTA: distribución método de pago */}
                {hasPie && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h2 style={estiloTituloSeccion}>Distribución por método de pago</h2>
                    <div style={{
                      backgroundColor: "var(--color-card)",
                      border: "0.5px solid var(--color-borde)",
                      padding: "20px 8px 16px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={pieDatos}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={EtiquetaTorta}
                          >
                            {pieDatos.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<TooltipTorta />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Leyenda manual */}
                      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", paddingTop: "4px" }}>
                        {pieDatos.map((entry) => (
                          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: entry.color, flexShrink: 0 }} />
                            <div>
                              <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", display: "block" }}>
                                {entry.name}
                              </span>
                              <span style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)", display: "block", lineHeight: 1.2 }}>
                                {fmt(entry.value)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* GRÁFICO 3 — BARRAS HORIZONTALES: top productos más vendidos */}
                {hasTop && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h2 style={estiloTituloSeccion}>Productos más vendidos</h2>
                    <div style={{
                      backgroundColor: "var(--color-card)",
                      border: "0.5px solid var(--color-borde)",
                      padding: "20px 8px 12px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}>
                      <ResponsiveContainer width="100%" height={Math.max(180, productosVisibles.length * 52)}>
                        <BarChart
                          data={productosVisibles}
                          layout="vertical"
                          margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid horizontal={false} stroke="var(--color-borde)" strokeDasharray="3 3" />
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="nombreCorto"
                            axisLine={false}
                            tickLine={false}
                            width={120}
                            tick={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fill: "var(--color-texto-muted)" }}
                          />
                          <Tooltip content={<TooltipTopProductos />} cursor={{ fill: "var(--color-superficie)" }} />
                          <Bar dataKey="unidades" radius={[0, 2, 2, 0]} maxBarSize={28} fill={PALETA[0]}>
                            <LabelList
                              dataKey="unidades"
                              position="right"
                              formatter={(v: unknown) => `${v} un.`}
                              style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", fill: "var(--color-texto-muted)" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      {topData.length > 5 && (
                        <div style={{
                          borderTop: "0.5px solid var(--color-borde)",
                          marginTop: "12px",
                          paddingTop: "10px",
                          textAlign: "center",
                        }}>
                          <button
                            onClick={() => setVerTodosProductos((v) => !v)}
                            style={{
                              fontSize: "10px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              background: "none",
                              border: "none",
                              color: "var(--color-texto-muted)",
                              cursor: "pointer",
                              padding: "2px 8px",
                            }}
                          >
                            {verTodosProductos ? "Ver menos" : `Ver todos (${topData.length})`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* COMBINACIONES FRECUENTES */}
          {(() => {
            const combinaciones = datos.combinacionesFrecuentes
            const visibles = verTodosCombinaciones ? combinaciones : combinaciones.slice(0, 5)

            return (
              <div>
                <h2 style={estiloTituloSeccion}>Combinaciones frecuentes</h2>
                <div style={{
                  backgroundColor: "var(--color-card)",
                  border: "0.5px solid var(--color-borde)",
                }}>
                  {combinaciones.length === 0 ? (
                    <p style={{
                      padding: "32px 24px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontFamily: "'Jost', sans-serif",
                      color: "var(--color-texto-muted)",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>
                      Aún no hay suficientes datos. Las combinaciones aparecerán a medida que se registren ventas con múltiples productos.
                    </p>
                  ) : (
                    <>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                            {["Producto 1", "Producto 2", "Veces comprados juntos"].map((col) => (
                              <th key={col} style={{
                                padding: "10px 16px",
                                textAlign: col === "Veces comprados juntos" ? "right" : "left",
                                fontSize: "9px",
                                fontWeight: 500,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "var(--color-texto-muted)",
                                fontFamily: "'Jost', sans-serif",
                              }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibles.map((combo, idx) => (
                            <tr key={idx} style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
                              <td style={{
                                padding: "11px 16px",
                                fontSize: "13px",
                                fontFamily: "'Cormorant Garamond', serif",
                                color: "var(--color-texto)",
                              }}>
                                {combo.producto1.nombre}
                              </td>
                              <td style={{
                                padding: "11px 16px",
                                fontSize: "13px",
                                fontFamily: "'Cormorant Garamond', serif",
                                color: "var(--color-texto)",
                              }}>
                                {combo.producto2.nombre}
                              </td>
                              <td style={{
                                padding: "11px 16px",
                                textAlign: "right",
                                fontSize: "13px",
                                fontFamily: "'Jost', sans-serif",
                                color: "var(--color-texto-muted)",
                              }}>
                                {combo.veces} {combo.veces === 1 ? "vez" : "veces"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {combinaciones.length > 5 && (
                        <div style={{
                          borderTop: "0.5px solid var(--color-borde)",
                          padding: "10px",
                          textAlign: "center",
                        }}>
                          <button
                            onClick={() => setVerTodosCombinaciones((v) => !v)}
                            style={{
                              fontSize: "10px",
                              fontFamily: "'Jost', sans-serif",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              background: "none",
                              border: "none",
                              color: "var(--color-texto-muted)",
                              cursor: "pointer",
                              padding: "2px 8px",
                            }}
                          >
                            {verTodosCombinaciones ? "Ver menos" : `Ver todos (${combinaciones.length})`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })()}
        </>
      ) : null}
    </div>
  )
}
