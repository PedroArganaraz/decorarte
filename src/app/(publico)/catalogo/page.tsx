import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import NavCategorias from "@/components/catalogo/NavCategorias"
import Link from "next/link"

export const revalidate = 60

interface Props {
  searchParams: Promise<{
    categoria?: string
    material?: string  // ID del material (no nombre)
    busqueda?: string
  }>
}

export default async function PaginaCatalogo({ searchParams }: Props) {
  const { categoria, material, busqueda } = await searchParams

  const [categorias, materialData] = await Promise.all([
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    material
      ? prisma.material.findUnique({ where: { id: material }, select: { nombre: true } })
      : Promise.resolve(null),
  ])

  // Filtra por materialId (relación) O por el campo string legacy, por si hay productos
  // que no tienen materialId cargado pero sí el campo de texto.
  const filtroMaterial: Prisma.ProductoWhereInput = material
    ? {
        OR: [
          { materialId: material },
          ...(materialData
            ? [{ material: { contains: materialData.nombre, mode: Prisma.QueryMode.insensitive } }]
            : []),
        ],
      }
    : {}

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(categoria && { categoria: { slug: categoria } }),
      ...filtroMaterial,
      ...(busqueda && { nombre: { contains: busqueda, mode: Prisma.QueryMode.insensitive } }),
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
    <div>
      <NavCategorias categoriaActiva={categoria} materialActivo={material} todosActivo={!categoria} />

      {/* CONTENIDO */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 64px" }}>
        <Link href="/" style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Inicio
        </Link>

        <div style={{ marginBottom: "20px" }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "32px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            marginBottom: "4px",
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

        {/* GRILLA */}
        {productosSerializados.length === 0 ? (
          <div style={{ padding: "80px 24px", textAlign: "center" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              fontWeight: 300,
              color: "var(--color-texto-muted)",
              marginBottom: "16px",
            }}>
              No hay productos en esta categoría
            </p>
            <Link href="/catalogo" style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-texto)",
              textDecoration: "none",
              borderBottom: "0.5px solid var(--color-texto)",
              paddingBottom: "2px",
            }}>
              Ver todos
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {productosSerializados.map((producto: typeof productosSerializados[number]) => (
              <TarjetaProducto key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
