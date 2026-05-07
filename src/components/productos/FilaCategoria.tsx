"use client"

import { useState } from "react"
import EliminarCategoria from "./EliminarCategoria"
import GestionMateriales from "./GestionMateriales"
import type { Prisma } from "@prisma/client"
type Material = Prisma.MaterialGetPayload<{}>

interface Props {
  categoria: {
    id: string
    nombre: string
    slug: string
    activa: boolean
    materiales: Material[]
    _count: { productos: number }
  }
}

export default function FilaCategoria({ categoria }: Props) {
  const [expandida, setExpandida] = useState(false)
  const [cantidadMateriales, setCantidadMateriales] = useState(categoria.materiales.length)

  return (
    <>
      <tr style={{ borderBottom: expandida ? "none" : "0.5px solid var(--color-superficie)" }}>
        <td style={{ padding: "14px 16px", fontSize: "14px", color: "var(--color-texto)" }}>
          {categoria.nombre}
        </td>
        <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--color-texto-muted)", fontFamily: "monospace" }}>
          {categoria.slug}
        </td>
        <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--color-texto-muted)" }}>
          {categoria._count.productos}
        </td>
        <td style={{ padding: "14px 16px" }}>
          <button
            onClick={() => setExpandida(!expandida)}
            style={{
              fontSize: "10px",
              fontFamily: "'Jost', sans-serif",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "var(--color-acento)",
              border: "0.5px solid var(--color-acento)",
              borderRadius: 0,
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            {cantidadMateriales} {expandida ? "▲" : "▼"}
          </button>
        </td>
        <td style={{ padding: "14px 16px" }}>
          <span style={{
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 8px",
            backgroundColor: categoria.activa ? "var(--color-texto)" : "var(--color-superficie)",
            color: categoria.activa ? "var(--color-fondo)" : "var(--color-texto-muted)",
          }}>
            {categoria.activa ? "Activa" : "Inactiva"}
          </span>
        </td>
        <td style={{ padding: "14px 16px", textAlign: "right" }}>
          <EliminarCategoria
            id={categoria.id}
            nombre={categoria.nombre}
            tieneProductos={categoria._count.productos > 0}
          />
        </td>
      </tr>
      {expandida && (
        <tr style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
          <td colSpan={6} style={{ padding: "0 16px 16px" }}>
            <GestionMateriales
              categoriaId={categoria.id}
              categoriaNombre={categoria.nombre}
              onCambio={(cantidad) => setCantidadMateriales(cantidad)}
            />
          </td>
        </tr>
      )}
    </>
  )
}
