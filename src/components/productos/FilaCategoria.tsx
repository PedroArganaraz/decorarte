"use client"

import EliminarCategoria from "./EliminarCategoria"
import EditarCategoria from "./EditarCategoria"

interface Props {
  categoria: {
    id: string
    nombre: string
    slug: string
    descripcion: string | null
    activa: boolean
    _count: { productos: number }
  }
}

export default function FilaCategoria({ categoria }: Props) {
  return (
    <tr style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          <EditarCategoria
            id={categoria.id}
            nombreActual={categoria.nombre}
            descripcionActual={categoria.descripcion ?? null}
          />
          <EliminarCategoria
            id={categoria.id}
            nombre={categoria.nombre}
            tieneProductos={categoria._count.productos > 0}
          />
        </div>
      </td>
    </tr>
  )
}
