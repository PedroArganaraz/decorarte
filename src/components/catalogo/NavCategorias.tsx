import { prisma } from "@/lib/prisma"
import Link from "next/link"

interface Props {
  categoriaActiva?: string
  todosActivo?: boolean
}

export default async function NavCategorias({ categoriaActiva, todosActivo }: Props) {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  const estiloLink = (activo: boolean): React.CSSProperties => ({
    padding: "12px 20px",
    fontSize: "11px",
    fontWeight: activo ? 500 : 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    textDecoration: "none",
    color: activo ? "var(--color-texto)" : "var(--color-texto-muted)",
    borderBottom: activo ? "2px solid var(--color-texto)" : "2px solid transparent",
    whiteSpace: "nowrap",
    marginBottom: "-0.5px",
  })

  return (
    <div style={{
      borderBottom: "0.5px solid var(--color-borde)",
      backgroundColor: "var(--color-fondo)",
      position: "sticky",
      top: "57px",
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        <Link href="/catalogo" style={estiloLink(!!todosActivo)}>
          Todos
        </Link>
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            style={estiloLink(categoriaActiva === cat.slug)}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>
    </div>
  )
}
