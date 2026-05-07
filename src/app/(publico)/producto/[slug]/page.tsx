import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import GaleriaProducto from "@/components/productos/GaleriaProducto"
import BotonAgregarCarrito from "@/components/carrito/BotonAgregarCarrito"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import Link from "next/link"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params

  const producto = await prisma.producto.findUnique({
    where: { slug, activo: true },
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      categoria: true,
    },
  })

  if (!producto) notFound()

  const relacionados = await prisma.producto.findMany({
    where: {
      activo: true,
      categoriaId: producto.categoriaId,
      id: { not: producto.id },
    },
    take: 4,
    select: {
      id: true,
      nombre: true,
      slug: true,
      precio: true,
      precioAnterior: true,
      stock: true,
      activo: true,
      destacado: true,
      imagenes: {
        select: { urlPublica: true, altText: true, esPrincipal: true },
        orderBy: { orden: "asc" },
      },
      categoria: { select: { nombre: true, slug: true } },
    },
  })

  const relacionadosSerializados = relacionados.map((p: typeof relacionados[number]) => ({
    ...p,
    precio: Number(p.precio),
    precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
  }))

  const productoSerializado = {
    ...producto,
    precio: Number(producto.precio),
    precioAnterior: producto.precioAnterior
      ? Number(producto.precioAnterior)
      : null,
  }

  return (
    <div>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>

        {/* BREADCRUMB */}
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "40px",
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <Link href="/catalogo" style={{
            color: "var(--color-texto-muted)",
            textDecoration: "none",
          }}>
            {producto.categoria.nombre}
          </Link>
          <span style={{ color: "var(--color-texto-sutil)" }}>›</span>
          <span style={{ color: "var(--color-texto)" }}>{producto.nombre}</span>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
          gap: "40px",
          alignItems: "start",
        }}>
          {/* GALERÍA */}
          <GaleriaProducto imagenes={producto.imagenes} />

          {/* INFO */}
          <div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-texto-muted)",
              }}>
                {producto.categoria.nombre}
              </span>
              {producto.material && (
                <>
                  <span style={{ color: "var(--color-borde)", margin: "0 8px" }}>·</span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 400,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--color-acento)",
                  }}>
                    {producto.material}
                  </span>
                </>
              )}
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "36px",
              fontWeight: 300,
              letterSpacing: "0.03em",
              color: "var(--color-texto)",
              marginBottom: "20px",
              lineHeight: 1.2,
            }}>
              {producto.nombre}
            </h1>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "28px",
                fontWeight: 300,
                color: "var(--color-texto)",
              }}>
                ${productoSerializado.precio.toLocaleString("es-AR")}
              </span>
              {productoSerializado.precioAnterior && (
                <span style={{
                  fontSize: "16px",
                  color: "var(--color-texto-sutil)",
                  textDecoration: "line-through",
                }}>
                  ${productoSerializado.precioAnterior.toLocaleString("es-AR")}
                </span>
              )}
            </div>

            {producto.talle && (
              <div style={{ marginBottom: "24px" }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: 300,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-texto-muted)",
                  marginRight: "8px",
                }}>
                  Talle
                </span>
                <span style={{
                  fontSize: "18px",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  color: "var(--color-texto)",
                }}>
                  {producto.talle}
                </span>
              </div>
            )}

            {producto.descripcion && (
              <p style={{
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--color-texto-muted)",
                marginBottom: "32px",
                letterSpacing: "0.03em",
              }}>
                {producto.descripcion}
              </p>
            )}

            <div style={{
              paddingTop: "24px",
              borderTop: "0.5px solid var(--color-borde)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              <BotonAgregarCarrito producto={productoSerializado} />
            </div>

          </div>
        </div>

        {/* RELACIONADOS */}
        {relacionadosSerializados.length > 0 && (
          <div style={{ marginTop: "80px" }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "28px",
              fontWeight: 300,
              letterSpacing: "0.05em",
              color: "var(--color-texto)",
              marginBottom: "32px",
            }}>
              También te puede gustar
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
            }}>
              {relacionadosSerializados.map((p: typeof relacionadosSerializados[number]) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
