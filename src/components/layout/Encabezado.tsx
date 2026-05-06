"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import IconoCarrito from "@/components/carrito/IconoCarrito"
import { crearClienteNavegador } from "@/lib/supabase/cliente"
import type { Categoria } from "@prisma/client"

interface Props {
  categorias: Categoria[]
}

export default function Encabezado({ categorias }: Props) {
  const pathname = usePathname()
  const [tieneSesion, setTieneSesion] = useState(false)

  useEffect(() => {
    const supabase = crearClienteNavegador()
    supabase.auth.getSession().then(({ data }) => {
      setTieneSesion(!!data.session)
    })
  }, [])

  return (
    <header style={{
      backgroundColor: "var(--color-fondo)",
      borderBottom: "0.5px solid var(--color-borde)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
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
          gap: "16px",
        }}>
          <Link
            href={tieneSesion ? "/panel" : "/auth/login"}
            style={{
              color: "var(--color-texto)",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Acceso vendedoras"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
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
