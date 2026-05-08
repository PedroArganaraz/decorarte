import { prisma } from "@/lib/prisma"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import Link from "next/link"

export const revalidate = 1800

interface Props {
  searchParams: Promise<{
    categoria?: string
    material?: string
    busqueda?: string
  }>
}

export default async function PaginaCatalogo({ searchParams }: Props) {
  const { categoria, material, busqueda } = await searchParams

  const categorias = await prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
  })

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(categoria && { categoria: { slug: categoria } }),
      ...(material && { material }),
      ...(busqueda && { nombre: { contains: busqueda, mode: "insensitive" } }),
    },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      slug: true,
      precio: true,
      precioAnterior: true,
      stock: true,
      activo: true,
      destacado: true,
      material: true,
      imagenes: {
        select: { urlPublica: true, altText: true, esPrincipal: true },
        orderBy: { orden: "asc" },
      },
      categoria: { select: { nombre: true, slug: true } },
    },
  })

  const productosSerializados = productos.map((p: typeof productos[number]) => ({
    ...p,
    precio: Number(p.precio),
    precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
  }))

  const categoriaActiva = categorias.find((c: typeof categorias[number]) => c.slug === categoria)

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>

      <Link
        href="/"
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "24px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Inicio
      </Link>

      {/* TÍTULO */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "40px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
          marginBottom: "8px",
        }}>
          {categoriaActiva ? categoriaActiva.nombre : "Todos los accesorios"}
        </h1>
        <p style={{
          fontSize: "12px",
          color: "var(--color-texto-muted)",
          letterSpacing: "0.05em",
        }}>
          {productosSerializados.length} {productosSerializados.length === 1 ? "pieza" : "piezas"}
        </p>
      </div>

      {/* FILTROS POR CATEGORÍA */}
      <div style={{
        display: "flex",
        gap: "0",
        marginBottom: "32px",
        borderBottom: "0.5px solid var(--color-borde)",
        overflowX: "auto",
        scrollbarWidth: "none" as any,
        msOverflowStyle: "none" as any,
        WebkitOverflowScrolling: "touch" as any,
      }}>
        <Link
          href="/catalogo"
          style={{
            padding: "10px 20px",
            fontSize: "11px",
            fontWeight: !categoria ? 500 : 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
            color: !categoria ? "var(--color-texto)" : "var(--color-texto-muted)",
            borderBottom: !categoria
              ? "2px solid var(--color-texto)"
              : "2px solid transparent",
            whiteSpace: "nowrap",
            marginBottom: "-0.5px",
          }}
        >
          Todos
        </Link>
        {categorias.map((cat: typeof categorias[number]) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            style={{
              padding: "10px 20px",
              fontSize: "11px",
              fontWeight: categoria === cat.slug ? 500 : 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: categoria === cat.slug
                ? "var(--color-texto)"
                : "var(--color-texto-muted)",
              borderBottom: categoria === cat.slug
                ? "2px solid var(--color-texto)"
                : "2px solid transparent",
              whiteSpace: "nowrap",
              marginBottom: "-0.5px",
            }}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>

      {/* GRILLA */}
      {productosSerializados.length === 0 ? (
        <div style={{
          padding: "80px 24px",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "24px",
            fontWeight: 300,
            color: "var(--color-texto-muted)",
            marginBottom: "16px",
          }}>
            No hay productos en esta categoría
          </p>
          <Link
            href="/catalogo"
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-texto)",
              textDecoration: "none",
              borderBottom: "0.5px solid var(--color-texto)",
              paddingBottom: "2px",
            }}
          >
            Ver todos
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}>
          {productosSerializados.map((producto: typeof productosSerializados[number]) => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}
