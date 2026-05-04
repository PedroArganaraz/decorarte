import { prisma } from "@/lib/prisma"
import FormularioCategoria from "@/components/productos/FormularioCategoria"
import EliminarCategoria from "@/components/productos/EliminarCategoria"

export default async function PaginaCategorias() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { productos: true } } },
  })

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "32px",
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
        }}>
          Categorías
        </h1>
        <FormularioCategoria />
      </div>

      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
      }}>
        {categorias.length === 0 ? (
          <div style={{
            padding: "48px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-texto-muted)",
            letterSpacing: "0.05em",
          }}>
            No hay categorías creadas todavía
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Nombre", "Slug", "Productos", "Estado", ""].map((col) => (
                  <th key={col} style={{
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
              {categorias.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "var(--color-texto)" }}>
                    {cat.nombre}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--color-texto-muted)", fontFamily: "monospace" }}>
                    {cat.slug}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--color-texto-muted)" }}>
                    {cat._count.productos}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      backgroundColor: cat.activa ? "#2C2C2A" : "var(--color-superficie)",
                      color: cat.activa ? "var(--color-fondo)" : "var(--color-texto-muted)",
                    }}>
                      {cat.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <EliminarCategoria
                      id={cat.id}
                      nombre={cat.nombre}
                      tieneProductos={cat._count.productos > 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
