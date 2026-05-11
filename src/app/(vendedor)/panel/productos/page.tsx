import { prisma } from "@/lib/prisma"
import Link from "next/link"
import FiltrosProductos from "@/components/productos/FiltrosProductos"

interface Props {
  searchParams: Promise<{
    nombre?: string
    categoriaId?: string
    soloActivos?: string
  }>
}

export default async function PaginaProductos({ searchParams }: Props) {
  const { nombre, categoriaId, soloActivos } = await searchParams

  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      where: {
        ...(nombre && { nombre: { contains: nombre, mode: "insensitive" } }),
        ...(categoriaId && { categoriaId }),
        ...(soloActivos === "1" && { activo: true }),
      },
      orderBy: { stock: "asc" },
      include: {
        categoria: true,
        imagenes: {
          where: { esPrincipal: true },
          take: 1,
        },
        materialRel: {
          select: { nombre: true },
        },
      },
    }),
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
  ])

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
          Productos
        </h1>
        <Link
          href="/panel/productos/nuevo"
          style={{
            padding: "10px 20px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + Nuevo producto
        </Link>
      </div>

      <FiltrosProductos categorias={categorias} />

      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        overflowX: "auto",
      }}>
        {productos.length === 0 ? (
          <div style={{
            padding: "48px",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-texto-muted)",
            letterSpacing: "0.05em",
          }}>
            No hay productos cargados todavía.{" "}
            <Link href="/panel/productos/nuevo" style={{ color: "var(--color-texto)", textDecoration: "underline" }}>
              Crear el primero
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-borde)" }}>
                {["Imagen", "Nombre", "Categoría", "Material", "Precio", "Stock", "Estado", ""].map((col: string) => (
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
              {productos.map((producto: typeof productos[number]) => (
                <tr key={producto.id} style={{ borderBottom: "0.5px solid var(--color-superficie)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "var(--color-superficie)",
                      backgroundImage: producto.imagenes[0] ? `url(${producto.imagenes[0].urlPublica})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
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
                    {producto.categoria.nombre}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-acento)" }}>
                    {producto.materialRel?.nombre ?? producto.material ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13px", color: "var(--color-texto)" }}>
                        ${Number(producto.precio).toLocaleString("es-AR")}
                      </span>
                      {producto.precioMinimo != null &&
                        Number(producto.precio) < Number(producto.precioMinimo) && (
                        <span
                          title={`Precio mínimo: $${Number(producto.precioMinimo).toLocaleString("es-AR")}`}
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
                        color: "var(--color-texto-muted)",
                        border: "0.5px solid var(--color-borde)",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Editar
                    </Link>
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
