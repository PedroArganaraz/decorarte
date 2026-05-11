"use client"

import { useState, useEffect, useCallback } from "react"

const HOY = new Date()
const ANIO_ACTUAL = HOY.getFullYear()
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2]
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface CategoriaDatos {
  categoria: string
  cantidad: number
  total: number
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
  }
  gananciaNeta: number
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

function fmt(n: number): string {
  return `$${n.toLocaleString("es-AR")}`
}

export default function DashboardReportes() {
  const [mes, setMes] = useState(HOY.getMonth())
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const [verAnioCompleto, setVerAnioCompleto] = useState(false)
  const [datos, setDatos] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

          {/* SECCIÓN CAJA */}
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "var(--color-texto)",
              margin: "0 0 12px",
            }}>
              Caja
            </h2>
            <div style={{
              backgroundColor: "var(--color-card)",
              border: "0.5px solid var(--color-borde)",
            }}>
              {/* Cabecera de columnas */}
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

              {/* Filas */}
              {[
                {
                  label: "Efectivo",
                  ingresos: datos.ventas.desglosePago.efectivo,
                  gastos: datos.gastos.desglosePago.efectivo,
                  esTotal: false,
                },
                {
                  label: "Transferencia",
                  ingresos: datos.ventas.desglosePago.transferencia,
                  gastos: datos.gastos.desglosePago.transferencia,
                  esTotal: false,
                },
                {
                  label: "Total",
                  ingresos: datos.ventas.ingresosBrutos,
                  gastos: datos.gastos.total,
                  esTotal: true,
                },
              ].map(({ label, ingresos, gastos: g, esTotal }, idx, arr) => {
                const balance = ingresos - g
                const negativo = balance < 0
                return (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr 1fr 1fr",
                      borderBottom: idx < arr.length - 1 ? "0.5px solid var(--color-borde)" : "none",
                      backgroundColor: esTotal ? "var(--color-superficie)" : "transparent",
                    }}
                  >
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
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: esTotal ? "18px" : "16px",
                        fontWeight: 400,
                        color: "var(--color-texto)",
                      }}>
                        {fmt(ingresos)}
                      </span>
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: esTotal ? "18px" : "16px",
                        fontWeight: 400,
                        color: "var(--color-texto-muted)",
                      }}>
                        {fmt(g)}
                      </span>
                    </div>
                    <div style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: esTotal ? "18px" : "16px",
                        fontWeight: 400,
                        color: negativo ? "var(--color-acento)" : "var(--color-texto)",
                      }}>
                        {negativo && "−"}{fmt(Math.abs(balance))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* VENTAS POR CATEGORÍA */}
          {datos.ventas.porCategoria.length > 0 && (() => {
            const ordenadas = [...datos.ventas.porCategoria].sort((a, b) => b.total - a.total)
            const maxTotal = Math.max(...ordenadas.map((c) => c.total), 1)
            return (
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  color: "var(--color-texto)",
                  margin: "0 0 12px",
                }}>
                  Ventas por categoría
                </h2>
                <div style={{
                  backgroundColor: "var(--color-card)",
                  border: "0.5px solid var(--color-borde)",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}>
                  {ordenadas.map((cat) => {
                    const pct = (cat.total / maxTotal) * 100
                    return (
                      <div key={cat.categoria} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontFamily: "'Jost', sans-serif",
                          color: "var(--color-texto-muted)",
                          minWidth: "100px",
                          textAlign: "right",
                          flexShrink: 0,
                        }}>
                          {cat.categoria}
                        </span>
                        <div style={{
                          flex: 1,
                          height: "7px",
                          backgroundColor: "var(--color-superficie)",
                          position: "relative",
                        }}>
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: "var(--color-texto)",
                          }} />
                        </div>
                        <div style={{ minWidth: "130px", flexShrink: 0, textAlign: "right" }}>
                          <span style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "16px",
                            fontWeight: 400,
                            color: "var(--color-texto)",
                          }}>
                            {fmt(cat.total)}
                          </span>
                          <span style={{
                            fontSize: "10px",
                            fontFamily: "'Jost', sans-serif",
                            color: "var(--color-texto-muted)",
                            marginLeft: "8px",
                          }}>
                            {cat.cantidad} {cat.cantidad === 1 ? "un." : "un."}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

        </>
      ) : null}
    </div>
  )
}
