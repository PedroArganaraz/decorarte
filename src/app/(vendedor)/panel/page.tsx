import { crearClienteServidor } from "@/lib/supabase/servidor"
import { prisma } from "@/lib/prisma"

export default async function PaginaPanel() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const [totalProductos, totalCategorias, productosActivos, productosSinStock] = await Promise.all([
    prisma.producto.count(),
    prisma.categoria.count(),
    prisma.producto.count({ where: { activo: true } }),
    prisma.producto.findMany({
      where: { activo: true, stock: 0 },
      select: {
        id: true,
        nombre: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <div>
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "28px",
        fontWeight: 300,
        letterSpacing: "0.05em",
        color: "var(--color-texto)",
        marginBottom: "8px",
      }}>
        Bienvenida
      </h1>
      <p style={{
        fontSize: "12px",
        color: "var(--color-texto-muted)",
        letterSpacing: "0.05em",
        marginBottom: "32px",
      }}>
        {user?.email}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
      }}>
        {[
          { label: "Total productos", valor: totalProductos },
          { label: "Productos activos", valor: productosActivos },
          { label: "Categorías", valor: totalCategorias },
        ].map((stat: { label: string; valor: number }) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "var(--color-card)",
              border: "0.5px solid var(--color-borde)",
              padding: "24px",
            }}
          >
            <div style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
              marginBottom: "8px",
            }}>
              {stat.label}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "36px",
              fontWeight: 300,
              color: "var(--color-texto)",
              lineHeight: "1",
            }}>
              {stat.valor}
            </div>
          </div>
        ))}
      </div>

      {productosSinStock.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: "var(--color-texto)",
            margin: "0 0 12px",
          }}>
            Alertas de stock
          </h2>
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
          }}>
            {productosSinStock.map((producto, i) => (
              <div
                key={producto.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  borderBottom: i < productosSinStock.length - 1
                    ? "0.5px solid var(--color-borde)"
                    : "none",
                }}
              >
                <div>
                  <span style={{
                    fontSize: "14px",
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "var(--color-texto)",
                  }}>
                    {producto.nombre}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontFamily: "'Jost', sans-serif",
                    color: "var(--color-texto-muted)",
                    letterSpacing: "0.06em",
                    marginLeft: "10px",
                  }}>
                    {producto.categoria.nombre}
                  </span>
                </div>
                <span style={{
                  fontSize: "9px",
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-acento)",
                  padding: "3px 8px",
                  border: "0.5px solid var(--color-acento)",
                }}>
                  Sin stock
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
