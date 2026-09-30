"use client"

import { useState } from "react"
import Link from "next/link"

export interface ProductoFila {
  id: string
  nombre: string
  destacado: boolean
  activo: boolean
  stock: number
  precio: number
  precioAnterior: number | null
  precioMinimo: number | null
  material: string | null
  color: string | null
  creadoEn: string
  imagenUrl: string | null
  imagenPosicion: number | null
  categoriaNombre: string
  materialRelNombre: string | null
}

const AZUL_PASTEL = "#dceeff"

export default function TablaProductos({ productos }: { productos: ProductoFila[] }) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
          {["", "Imagen", "Nombre", "Categoría", "Material", "Color", "Precio", "Stock", "Estado", "Ingreso", ""].map((col, i) => (
            <th key={i} style={{
              padding: "12px 16px",
              textAlign: "left",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {productos.map((producto) => {
          const marcado = seleccionados.has(producto.id)
          return (
            <tr
              key={producto.id}
              style={{
                borderBottom: "0.5px solid var(--color-superficie)",
                backgroundColor: marcado ? AZUL_PASTEL : "transparent",
                transition: "background-color 0.15s ease",
              }}
            >
              <td style={{ padding: "12px 16px", width: "40px" }}>
                <button
                  type="button"
                  onClick={() => toggleSeleccion(producto.id)}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: marcado ? "none" : "0.5px solid var(--color-borde)",
                    backgroundColor: marcado ? "#4a90d9" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    borderRadius: 0,
                    padding: 0,
                  }}
                  aria-label={marcado ? "Desmarcar" : "Marcar"}
                >
                  {marcado && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "var(--color-superficie)",
                  backgroundImage: producto.imagenUrl ? `url(${producto.imagenUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: `center ${producto.imagenPosicion ?? 50}%`,
                }} />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "15px",
                  color: "var(--color-texto)",
                  marginBottom: "2px",
                }}>
                  {producto.nombre}
                </div>
                {producto.destacado && (
                  <span style={{
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-acento)",
                  }}>
                    Destacado
                  </span>
                )}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-texto-muted)" }}>
                {producto.categoriaNombre}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-acento)" }}>
                {producto.materialRelNombre ?? producto.material ?? "—"}
              </td>
              <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-texto-muted)" }}>
                {producto.color ?? "—"}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div>
                    {producto.precioAnterior != null && producto.precioAnterior > 0 ? (
                      <>
                        <span style={{ display: "block", fontSize: "11px", color: "var(--color-texto-muted)", textDecoration: "line-through" }}>
                          ${producto.precio.toLocaleString("es-AR")}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--color-texto)" }}>
                          ${producto.precioAnterior.toLocaleString("es-AR")}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: "13px", color: "var(--color-texto)" }}>
                        ${producto.precio.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  {producto.precioMinimo != null && producto.precio < producto.precioMinimo && (
                    <span
                      title={`Precio mínimo: $${producto.precioMinimo.toLocaleString("es-AR")}`}
                      style={{
                        fontSize: "9px",
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        color: "var(--color-acento)",
                        border: "0.5px solid var(--color-acento)",
                        padding: "2px 5px",
                        flexShrink: 0,
                        cursor: "default",
                      }}
                    >
                      ⚠ mín
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px 16px", fontSize: "13px", color: producto.stock === 0 ? "#A32D2D" : "var(--color-texto-muted)" }}>
                {producto.stock}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  backgroundColor: producto.activo ? "var(--color-texto)" : "var(--color-superficie)",
                  color: producto.activo ? "var(--color-fondo)" : "var(--color-texto-muted)",
                }}>
                  {producto.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-texto-muted)", whiteSpace: "nowrap" }}>
                {producto.creadoEn}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                <Link
                  href={`/panel/productos/${producto.id}`}
                  style={{
                    fontSize: "10px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    backgroundColor: "transparent",
                    color: "var(--color-texto)",
                    border: "0.5px solid var(--color-texto)",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Editar
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
