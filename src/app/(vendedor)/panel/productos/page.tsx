import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ordenarPorPrecioEfectivo } from "@/lib/precios"
import Link from "next/link"
import FiltrosProductos from "@/components/productos/FiltrosProductos"
import TablaProductos from "@/components/productos/TablaProductos"

export const dynamic = "force-dynamic"

const LIMIT = 20

interface Props {
  searchParams: Promise<{
    nombre?: string
    categoriaId?: string
    soloActivos?: string
    material?: string
    color?: string
    orden?: string
    fechaDesde?: string
    fechaHasta?: string
    page?: string
  }>
}

export default async function PaginaProductos({ searchParams }: Props) {
  const { nombre, categoriaId, soloActivos, material, color, orden, fechaDesde, fechaHasta, page } = await searchParams

  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1)

  const filtro = {
    ...(nombre && { nombre: { contains: nombre, mode: "insensitive" as const } }),
    ...(categoriaId && { categoriaId }),
    ...(soloActivos === "activo" && { activo: true }),
    ...(soloActivos === "inactivo" && { activo: false }),
    ...(material && { material: { contains: material, mode: "insensitive" as const } }),
    ...(color && { color: { contains: color, mode: "insensitive" as const } }),
    ...((fechaDesde || fechaHasta) && {
      creadoEn: {
        ...(fechaDesde && { gte: new Date(fechaDesde + "T00:00:00.000Z") }),
        ...(fechaHasta && { lte: new Date(fechaHasta + "T23:59:59.999Z") }),
      },
    }),
  }

  const incluirProducto = {
    categoria: true,
    imagenes: {
      where: { esPrincipal: true },
      take: 1,
    },
    materialRel: {
      select: { nombre: true },
    },
  } satisfies Prisma.ProductoInclude

  const omitir = (pageNum - 1) * LIMIT

  // Por precio se ordena por el precio efectivo (con descuento si lo hay), que Prisma no
  // puede expresar: se ordenan en memoria todos los que cumplen los filtros y recién
  // después se pagina.
  async function obtenerProductos() {
    if (orden !== "precio_asc" && orden !== "precio_desc") {
      const [cantidad, filas] = await Promise.all([
        prisma.producto.count({ where: filtro }),
        prisma.producto.findMany({
          where: filtro,
          orderBy: { stock: "asc" },
          skip: omitir,
          take: LIMIT,
          include: incluirProducto,
        }),
      ])
      return { total: cantidad, productos: filas }
    }

    const candidatos = await prisma.producto.findMany({
      where: filtro,
      select: { id: true, precio: true, precioAnterior: true, creadoEn: true },
    })
    const ordenados = ordenarPorPrecioEfectivo(
      candidatos,
      orden === "precio_desc" ? "desc" : "asc"
    )
    const idsPagina = ordenados.slice(omitir, omitir + LIMIT).map((c) => c.id)
    const filas = await prisma.producto.findMany({
      where: { id: { in: idsPagina } },
      include: incluirProducto,
    })
    const filaPorId = new Map(filas.map((f) => [f.id, f]))
    const productosPagina = idsPagina.flatMap((id) => {
      const fila = filaPorId.get(id)
      return fila ? [fila] : []
    })
    return { total: ordenados.length, productos: productosPagina }
  }

  const [{ total, productos }, categorias, materialesRaw] = await Promise.all([
    obtenerProductos(),
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    }),
    prisma.producto.findMany({
      where: { activo: true, material: { not: null } },
      select: { material: true },
      distinct: ["material"],
    }),
  ])

  const materialesDisponibles = [...new Set(
    materialesRaw
      .map((p) => p.material)
      .filter((m): m is string => typeof m === "string" && m.trim() !== "")
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())
  )].sort()

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT))

  function urlPagina(pag: number) {
    const params = new URLSearchParams()
    if (nombre) params.set("nombre", nombre)
    if (categoriaId) params.set("categoriaId", categoriaId)
    if (soloActivos) params.set("soloActivos", soloActivos)
    if (material) params.set("material", material)
    if (color) params.set("color", color)
    if (orden) params.set("orden", orden)
    if (pag > 1) params.set("page", String(pag))
    const qs = params.toString()
    return `/panel/productos${qs ? `?${qs}` : ""}`
  }

  const estiloBtnActivo: React.CSSProperties = {
    padding: "8px 16px",
    fontSize: "11px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 400,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    color: "var(--color-texto)",
    border: "0.5px solid var(--color-texto)",
    borderRadius: 0,
    textDecoration: "none",
    display: "inline-block",
  }

  const estiloBtnDeshabilitado: React.CSSProperties = {
    padding: "8px 16px",
    fontSize: "11px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 400,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    color: "var(--color-texto-muted)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    cursor: "not-allowed",
    opacity: 0.45,
  }

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

      <FiltrosProductos categorias={categorias} materiales={materialesDisponibles} />

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
            {total === 0 ? (
              <>
                No hay productos cargados todavía.{" "}
                <Link href="/panel/productos/nuevo" style={{ color: "var(--color-texto)", textDecoration: "underline" }}>
                  Crear el primero
                </Link>
              </>
            ) : (
              "No hay productos en esta página."
            )}
          </div>
        ) : (
          <TablaProductos
            productos={productos.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              destacado: p.destacado,
              activo: p.activo,
              marcado: p.marcado,
              stock: p.stock,
              precio: Number(p.precio),
              precioAnterior: p.precioAnterior != null ? Number(p.precioAnterior) : null,
              precioMinimo: p.precioMinimo != null ? Number(p.precioMinimo) : null,
              material: p.material ?? null,
              color: p.color ?? null,
              creadoEn: p.creadoEn.toISOString().split("T")[0].split("-").reverse().join("/"),
              imagenUrl: p.imagenes[0]?.urlPublica ?? null,
              imagenPosicion: p.imagenes[0]?.posicion ?? null,
              categoriaNombre: p.categoria.nombre,
              materialRelNombre: p.materialRel?.nombre ?? null,
            }))}
          />
        )}
      </div>

      {/* PAGINACIÓN */}
      {total > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          {pageNum <= 1 ? (
            <span style={estiloBtnDeshabilitado}>← Anterior</span>
          ) : (
            <Link href={urlPagina(pageNum - 1)} style={estiloBtnActivo}>
              ← Anterior
            </Link>
          )}

          <span style={{
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto-muted)",
            letterSpacing: "0.06em",
          }}>
            Página {pageNum} de {totalPaginas}
            <span style={{ color: "var(--color-texto-sutil)", marginLeft: "8px" }}>
              ({total} {total === 1 ? "producto" : "productos"})
            </span>
          </span>

          {pageNum >= totalPaginas ? (
            <span style={estiloBtnDeshabilitado}>Siguiente →</span>
          ) : (
            <Link href={urlPagina(pageNum + 1)} style={estiloBtnActivo}>
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
