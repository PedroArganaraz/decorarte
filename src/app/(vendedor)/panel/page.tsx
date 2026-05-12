import Link from "next/link"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import { prisma } from "@/lib/prisma"

export default async function PaginaPanel() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const [totalProductos, totalCategorias, productosActivos, productosSinStock, productosConStock] = await Promise.all([
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
    prisma.producto.findMany({
      where: { activo: true, stock: { gt: 0 }, costo: { not: null } },
      select: {
        stock: true,
        costo: true,
        categoria: { select: { nombre: true } },
      },
    }),
  ])

  const inventarioPorCategoria = Object.values(
    productosConStock.reduce<Record<string, { nombre: string; unidades: number; capital: number }>>(
      (acc, p) => {
        const nombre = p.categoria.nombre
        if (!acc[nombre]) acc[nombre] = { nombre, unidades: 0, capital: 0 }
        acc[nombre].unidades += p.stock
        acc[nombre].capital += p.stock * Number(p.costo)
        return acc
      },
      {}
    )
  ).sort((a, b) => b.capital - a.capital)

  const totalCapital = inventarioPorCategoria.reduce((s, c) => s + c.capital, 0)
  const totalUnidades = inventarioPorCategoria.reduce((s, c) => s + c.unidades, 0)

  function fmt(n: number) {
    return `$${n.toLocaleString("es-AR")}`
  }

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
      }}>
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
          }}>
            {user?.email}
          </p>
        </div>
        <Link href="/hero" style={{
          padding: "10px 20px",
          fontSize: "10px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backgroundColor: "var(--color-texto)",
          color: "var(--color-fondo)",
          border: "none",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}>
          Editar carrusel
        </Link>
      </div>

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

      {totalCapital > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: "var(--color-texto)",
            margin: "0 0 12px",
          }}>
            Inventario valorizado
          </h2>
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
          }}>
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "0.5px solid var(--color-borde)",
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
                Capital en stock
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "var(--color-texto)",
                margin: 0,
                letterSpacing: "0.02em",
              }}>
                {fmt(totalCapital)}
              </p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                  {(["Categoría", "Unidades en stock", "Capital invertido"] as const).map((col, i) => (
                    <th key={col} style={{
                      padding: "10px 16px",
                      textAlign: i === 0 ? "left" : "right",
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
                {inventarioPorCategoria.map((fila) => (
                  <tr key={fila.nombre} style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
                    <td style={{ padding: "11px 16px", fontSize: "13px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)" }}>
                      {fila.nombre}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: "13px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-muted)" }}>
                      {fila.unidades}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontSize: "14px", fontFamily: "'Cormorant Garamond', serif", color: "var(--color-texto)" }}>
                      {fmt(fila.capital)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "0.5px solid var(--color-borde)", backgroundColor: "var(--color-background-secondary)" }}>
                  <td style={{ padding: "11px 16px", fontSize: "9px", fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-texto-muted)" }}>
                    Total
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right", fontSize: "13px", fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "var(--color-texto-muted)" }}>
                    {totalUnidades}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right", fontSize: "15px", fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "var(--color-texto)" }}>
                    {fmt(totalCapital)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p style={{
              padding: "10px 16px",
              fontSize: "10px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto-sutil)",
              letterSpacing: "0.04em",
              margin: 0,
              borderTop: "0.5px solid var(--color-superficie)",
            }}>
              Refleja el estado actual del stock, independiente del período seleccionado.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
