import { prisma } from "@/lib/prisma"
import TarjetaProducto from "@/components/productos/TarjetaProducto"
import Link from "next/link"

export const revalidate = 1800

export default async function PaginaInicio() {
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
        select: { urlPublica: true, altText: true, esPrincipal: true },
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
        select: { urlPublica: true, altText: true, esPrincipal: true },
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
      {/* HERO */}
      <section style={{
        backgroundColor: "var(--color-superficie)",
        padding: "80px 24px",
        textAlign: "center",
        borderBottom: "0.5px solid var(--color-borde)",
      }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--color-acento)",
          marginBottom: "16px",
        }}>
          Nueva colección
        </p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
          lineHeight: 1.1,
          marginBottom: "20px",
          maxWidth: "600px",
          margin: "0 auto 20px",
        }}>
          Piezas que resaltan tu esencia
        </h2>
        <p style={{
          fontSize: "13px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto-muted)",
          marginBottom: "32px",
          lineHeight: 1.8,
        }}>
          Accesorios artesanales únicos.<br />
          Más que simples accesorios, son piezas que invitan a imaginar.
        </p>
        <Link
          href="/catalogo"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            textDecoration: "none",
          }}
        >
          Ver colección
        </Link>
      </section>

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
              Ver todos
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
