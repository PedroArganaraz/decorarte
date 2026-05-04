"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import IconoCarrito from "@/components/carrito/IconoCarrito"
import type { Categoria } from "@prisma/client"

interface Props {
  categorias: Categoria[]
}

export default function Encabezado({ categorias }: Props) {
  const pathname = usePathname()

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
        padding: "5px 24px",
        borderBottom: "0.5px solid var(--color-borde)",
        fontSize: "10px",
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
        padding: "12px 24px 8px",
      }}>
        <div />

        <Link href="/" style={{ textDecoration: "none" }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
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
        }}>
          <IconoCarrito />
        </div>
      </div>

      <nav style={{
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        padding: "0 24px 10px",
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
