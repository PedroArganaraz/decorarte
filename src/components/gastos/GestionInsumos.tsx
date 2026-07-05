"use client"

import { useState, useEffect, useCallback } from "react"

export interface Insumo {
  id: number
  nombre: string
  precioUnitario: number
  cantidadTotal: number
  cantidadDisponible: number
  unidad: string
  gastoId: string | null
  gasto: { id: string; descripcion: string } | null
}

const estiloTd: React.CSSProperties = {
  padding: "11px 14px",
  verticalAlign: "middle",
}

interface Props {
  refreshKey?: number
}

export default function GestionInsumos({ refreshKey }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsumos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch("/api/insumos")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error al cargar insumos")
      setInsumos(json.datos ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar insumos")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { fetchInsumos() }, [fetchInsumos, refreshKey])

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 400, letterSpacing: "0.04em", color: "var(--color-texto)", margin: 0 }}>
          Inventario de insumos
        </h2>
      </div>

      {error && (
        <p style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-acento)", padding: "10px 14px", border: "0.5px solid var(--color-acento)", backgroundColor: "#fdf5f3", margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      {cargando ? (
        <p style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>Cargando...</p>
      ) : insumos.length === 0 ? (
        <p style={{ padding: "24px 0", textAlign: "center", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", margin: 0 }}>No hay insumos registrados. Registrá un gasto de categoría Insumos para agregar uno.</p>
      ) : (
        <div style={{ backgroundColor: "var(--color-card)", border: "0.5px solid var(--color-borde)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Nombre", "Unidad", "Precio unit.", "Cant. total", "Disponible"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-texto-muted)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insumos.map((ins) => {
                const agotado = ins.cantidadDisponible === 0
                const pocaDisponible = ins.cantidadDisponible < ins.cantidadTotal * 0.2
                return (
                  <tr key={ins.id} style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                    <td style={estiloTd}>
                      <span style={{ fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)" }}>{ins.nombre}</span>
                    </td>
                    <td style={estiloTd}>
                      <span style={{ fontSize: "11px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)", letterSpacing: "0.04em" }}>{ins.unidad}</span>
                    </td>
                    <td style={estiloTd}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", color: "var(--color-texto)", whiteSpace: "nowrap" }}>
                        ${Number(ins.precioUnitario).toLocaleString("es-AR")}
                      </span>
                    </td>
                    <td style={estiloTd}>
                      <span style={{ fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto)" }}>{ins.cantidadTotal}</span>
                    </td>
                    <td style={estiloTd}>
                      <span style={{
                        fontSize: "13px",
                        fontFamily: "'Jost', sans-serif",
                        color: agotado ? "var(--color-acento)" : pocaDisponible ? "#E67E22" : "var(--color-texto)",
                        fontWeight: agotado || pocaDisponible ? 500 : 400,
                      }}>
                        {ins.cantidadDisponible}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
