import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import NavCategorias from "@/components/catalogo/NavCategorias"
import FiltrosCatalogo from "@/components/catalogo/FiltrosCatalogo"
import Link from "next/link"
import { Suspense } from "react"

export const revalidate = 60

const LIMIT = 15

interface Props {
  searchParams: Promise<{
    categoria?: string
    material?: string
    color?: string
    busqueda?: string
    orden?: string
    pagina?: string
  }>
}

export default async function PaginaCatalogo({ searchParams }: Props) {
  const { categoria, material, color, busqueda, orden, pagina } = await searchParams

  const paginaNum = Math.max(1, parseInt(pagina ?? "1", 10) || 1)

  const filtroMaterial: Prisma.ProductoWhereInput = material
    ? { material: { contains: material, mode: Prisma.QueryMode.insensitive } }
    : {}

  const where: Prisma.ProductoWhereInput = {
    activo: true,
    ...(categoria && { categoria: { slug: categoria } }),
    ...filtroMaterial,
    ...(color && { color: { contains: color, mode: Prisma.QueryMode.insensitive } }),
    ...(busqueda && { nombre: { contains: busqueda, mode: Prisma.QueryMode.insensitive } }),
  }

  const orderBy: Prisma.ProductoOrderByWithRelationInput =
    orden === "precio_asc" ? { precio: "asc" } :
    orden === "precio_desc" ? { precio: "desc" } :
    { creadoEn: "desc" }

  const [categorias, materialesRaw, total, productos] = await Promise.all([
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.producto.findMany({
      where: {
        activo: true,
        ...(categoria && { categoria: { slug: categoria } }),
        material: { not: null },
      },
      select: { material: true },
      distinct: ["material"],
    }),
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      orderBy,
      skip: (paginaNum - 1) * LIMIT,
      take: LIMIT,
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
        color: true,
        imagenes: {
          select: { urlPublica: true, altText: true, esPrincipal: true, posicion: true },
          orderBy: { orden: "asc" },
        },
        categoria: { select: { nombre: true, slug: true } },
        variantesComoA: { include: { productoB: { select: { color: true } } } },
        variantesComoB: { include: { productoA: { select: { color: true } } } },
      },
    }),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT))

  const materialesDisponibles = [...new Set(
    materialesRaw
      .map((p) => p.material)
      .filter((m): m is string => typeof m === "string" && m.trim() !== "")
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())
  )].sort()

  function urlPagina(pag: number) {
    const params = new URLSearchParams()
    if (categoria) params.set("categoria", categoria)
    if (material) params.set("material", material)
    if (color) params.set("color", color)
    if (busqueda) params.set("busqueda", busqueda)
    if (orden) params.set("orden", orden)
    if (pag > 1) params.set("pagina", String(pag))
    const qs = params.toString()
    return `/catalogo${qs ? `?${qs}` : ""}`
  }

  const fromParams = new URLSearchParams()
  if (categoria) fromParams.set("categoria", categoria)
  if (material) fromParams.set("material", material)
  if (busqueda) fromParams.set("busqueda", busqueda)
  if (orden) fromParams.set("orden", orden)
  const fromUrl = `/catalogo${fromParams.size > 0 ? `?${fromParams.toString()}` : ""}`

  const productosSerializados = productos.map((p: typeof productos[number]) => {
    const variantColors = [
      ...p.variantesComoA.map((v) => v.productoB.color),
      ...p.variantesComoB.map((v) => v.productoA.color),
    ]
    const colores = [...new Set(
      [p.color, ...variantColors].filter((c): c is string => typeof c === "string" && c.trim() !== "")
    )]
    return {
      ...p,
      precio: Number(p.precio),
      precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
      colores,
    }
  })

  const categoriaActiva = categorias.find((c: typeof categorias[number]) => c.slug === categoria)

  const estiloBtn = (activo: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: "11px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 400,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    color: activo ? "var(--color-texto)" : "var(--color-texto-sutil)",
    border: `0.5px solid ${activo ? "var(--color-texto)" : "var(--color-borde)"}`,
    borderRadius: 0,
    textDecoration: "none",
    display: "inline-block",
    cursor: activo ? "pointer" : "default",
    opacity: activo ? 1 : 0.4,
  })

  const inicioItem = (paginaNum - 1) * LIMIT + 1
  const finItem = Math.min(paginaNum * LIMIT, total)

  return (
    <div>
      <NavCategorias categoriaActiva={categoria} materialActivo={material} todosActivo={!categoria} />

      {/* CONTENIDO */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 64px" }}>
        <Link href="/" className="link-volver" style={{
          fontSize: "13px",
          letterSpacing: "0.1em",
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
            {total === 0
              ? "0 piezas"
              : `Mostrando ${inicioItem}–${finItem} de ${total} ${total === 1 ? "pieza" : "piezas"}`}
          </p>
        </div>

        <Suspense>
          <FiltrosCatalogo
            materiales={materialesDisponibles}
            materialActivo={material}
            colorActivo={color}
            ordenActivo={orden}
            busquedaActiva={busqueda}
          />
        </Suspense>

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
              Ver todo
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {productosSerializados.map((producto: typeof productosSerializados[number]) => (
              <TarjetaProducto key={producto.id} producto={producto} from={fromUrl} />
            ))}
          </div>
        )}

        {/* PAGINACIÓN */}
        {total > LIMIT && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "48px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            {paginaNum <= 1 ? (
              <span style={estiloBtn(false)}>← Anterior</span>
            ) : (
              <Link href={urlPagina(paginaNum - 1)} style={estiloBtn(true)}>
                ← Anterior
              </Link>
            )}

            <span style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto-muted)",
              letterSpacing: "0.06em",
            }}>
              Página {paginaNum} de {totalPaginas}
              <span style={{ color: "var(--color-texto-sutil)", marginLeft: "8px" }}>
                ({total} {total === 1 ? "pieza" : "piezas"})
              </span>
            </span>

            {paginaNum >= totalPaginas ? (
              <span style={estiloBtn(false)}>Siguiente →</span>
            ) : (
              <Link href={urlPagina(paginaNum + 1)} style={estiloBtn(true)}>
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
