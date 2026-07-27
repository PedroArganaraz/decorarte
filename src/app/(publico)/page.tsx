import { prisma } from "@/lib/prisma"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import NavCategorias from "@/components/catalogo/NavCategorias"
import Link from "next/link"
import HeroCarrusel from "@/components/hero/HeroCarrusel"

export const revalidate = 1800

export default async function PaginaInicio() {
  const [imagenesDesktop, imagenesMobile, configHero] = await Promise.all([
    prisma.imagenHero.findMany({
      where: { activa: true, vista: "desktop" },
      orderBy: { orden: "asc" },
      select: { id: true, urlPublica: true, posicion: true },
    }),
    prisma.imagenHero.findMany({
      where: { activa: true, vista: "mobile" },
      orderBy: { orden: "asc" },
      select: { id: true, urlPublica: true, posicion: true },
    }),
    prisma.configHero.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  // Si no hay imágenes mobile, usar las de desktop como fallback
  const imagenesMobileFinal = imagenesMobile.length > 0 ? imagenesMobile : imagenesDesktop
  const intervalo = configHero?.intervalo ?? 3

  const destacados = await prisma.producto.findMany({
    where: { activo: true, destacado: true },
    take: 4,
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
      imagenes: {
        select: { urlPublica: true, altText: true, esPrincipal: true, posicion: true },
        orderBy: { orden: "asc" },
      },
      categoria: { select: { nombre: true, slug: true } },
    },
  })

  const destacadosSerializados = destacados.map((p: typeof destacados[number]) => ({
    ...p,
    precio: Number(p.precio),
    precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
  }))

  const recientes = await prisma.producto.findMany({
    where: { activo: true },
    take: 8,
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
      imagenes: {
        select: { urlPublica: true, altText: true, esPrincipal: true, posicion: true },
        orderBy: { orden: "asc" },
      },
      categoria: { select: { nombre: true, slug: true } },
    },
  })

  const recientesSerializados = recientes.map((p: typeof recientes[number]) => ({
    ...p,
    precio: Number(p.precio),
    precioAnterior: p.precioAnterior ? Number(p.precioAnterior) : null,
  }))

  return (
    <div>
      <NavCategorias />

      {/* HERO */}
      <style>{`
        @media (min-width: 768px) { .hero-mobile { display: none; } }
        @media (max-width: 767px) { .hero-desktop { display: none; } }
      `}</style>
      <div className="hero-desktop">
        <HeroCarrusel imagenes={imagenesDesktop} intervalo={intervalo} />
      </div>
      <div className="hero-mobile">
        <HeroCarrusel imagenes={imagenesMobileFinal} intervalo={intervalo} />
      </div>

      {/* DESTACADOS */}
      {destacados.length > 0 && (
        <section style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "32px",
          }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "32px",
              fontWeight: 300,
              letterSpacing: "0.05em",
              color: "var(--color-texto)",
            }}>
              Destacados
            </h2>
            <Link
              href="/catalogo?destacados=true"
              style={{
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-texto-muted)",
                textDecoration: "none",
                borderBottom: "0.5px solid var(--color-borde)",
                paddingBottom: "2px",
              }}
            >
              Ver todo
            </Link>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px",
          }}>
            {destacadosSerializados.map((producto: typeof destacadosSerializados[number]) => (
              <TarjetaProducto key={producto.id} producto={producto} />
            ))}
          </div>
        </section>
      )}

      {/* RECIENTES */}
      <section style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: destacados.length > 0 ? "0 24px 64px" : "64px 24px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "32px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
          }}>
            Lo nuevo
          </h2>
          <Link
            href="/catalogo"
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-texto-muted)",
              textDecoration: "none",
              borderBottom: "0.5px solid var(--color-borde)",
              paddingBottom: "2px",
            }}
          >
            Ver todo
          </Link>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px",
        }}>
          {recientesSerializados.map((producto: typeof recientesSerializados[number]) => (
            <TarjetaProducto key={producto.id} producto={producto} />
          ))}
        </div>
      </section>
    </div>
  )
}
