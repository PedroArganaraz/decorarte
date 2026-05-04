"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usarCarrito } from "@/tiendas/carritoTienda"
import type { Categoria } from "@prisma/client"

interface Props {
  categorias: Categoria[]
}

export default function Encabezado({ categorias }: Props) {
  const pathname = usePathname()
  const totalItems = usarCarrito((s) => s.totalItems)

  return (
    <header style={{
      backgroundColor: "var(--color-fondo)",
      borderBottom: "0.5px solid var(--color-borde)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 24px",
        borderBottom: "0.5px solid var(--color-borde)",
        fontSize: "11px",
        color: "var(--color-texto-muted)",
        letterSpacing: "0.05em",
      }}>
        <span>Envíos a todo el país</span>
        <span>@decorarte.cba</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "20px 24px 16px",
      }}>
        <div />

        <Link href="/" style={{ textDecoration: "none" }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "var(--color-texto)",
            textAlign: "center",
          }}>
            DECORARTE
          </h1>
        </Link>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "16px",
        }}>
          <Link
            href="/carrito"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-texto)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems() > 0 && (
              <span style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--color-acento)",
              }}>
                ({totalItems()})
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav style={{
        display: "flex",
        justifyContent: "center",
        gap: "32px",
        padding: "0 24px 16px",
      }}>
        <Link
          href="/catalogo"
          style={{
            fontSize: "11px",
            fontWeight: pathname === "/catalogo" ? 500 : 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
            color: pathname === "/catalogo"
              ? "var(--color-texto)"
              : "var(--color-texto-muted)",
            borderBottom: pathname === "/catalogo"
              ? "0.5px solid var(--color-texto)"
              : "0.5px solid transparent",
            paddingBottom: "2px",
          }}
        >
          Todos
        </Link>
        {categorias.map((cat) => {
          const activo = pathname === `/catalogo?categoria=${cat.slug}`
          return (
            <Link
              key={cat.id}
              href={`/catalogo?categoria=${cat.slug}`}
              style={{
                fontSize: "11px",
                fontWeight: activo ? 500 : 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: activo ? "var(--color-texto)" : "var(--color-texto-muted)",
                borderBottom: activo
                  ? "0.5px solid var(--color-texto)"
                  : "0.5px solid transparent",
                paddingBottom: "2px",
              }}
            >
              {cat.nombre}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
