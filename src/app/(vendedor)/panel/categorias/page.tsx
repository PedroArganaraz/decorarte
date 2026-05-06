import { prisma } from "@/lib/prisma"
import FormularioCategoria from "@/components/productos/FormularioCategoria"
import FilaCategoria from "@/components/productos/FilaCategoria"

export default async function PaginaCategorias() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    include: {
      _count: { select: { productos: true } },
      materiales: { orderBy: { nombre: "asc" } },
    },
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
                {["Nombre", "Slug", "Productos", "Materiales", "Estado", ""].map((col) => (
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
                <FilaCategoria key={cat.id} categoria={cat} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
