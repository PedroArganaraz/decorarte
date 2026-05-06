"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { crearClienteNavegador } from "@/lib/supabase/cliente"

const navegacion = [
  { label: "Inicio", href: "/panel" },
  { label: "Productos", href: "/panel/productos" },
  { label: "Categorías", href: "/panel/categorias" },
]

interface Props {
  onCerrar?: () => void
}

export default function SidebarPanel({ onCerrar }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const cerrarSesion = async () => {
    const supabase = crearClienteNavegador()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside style={{
      width: "220px",
      minHeight: "100vh",
      backgroundColor: "var(--color-card)",
      borderRight: "0.5px solid var(--color-borde)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* LOGO */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "0.5px solid var(--color-borde)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "18px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "var(--color-texto)",
          }}>
            DECORARTE
          </span>
        </Link>
        <p style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-texto-sutil)",
          marginTop: "4px",
        }}>
          Panel de gestión
        </p>
      </div>

      {/* NAVEGACIÓN */}
      <nav style={{
        flex: 1,
        padding: "16px 0",
      }}>
        {navegacion.map(({ label, href }) => {
          const activo = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onCerrar}
              style={{
                display: "block",
                padding: "10px 20px",
                fontSize: "11px",
                fontWeight: activo ? 500 : 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: activo ? "var(--color-texto)" : "var(--color-texto-muted)",
                backgroundColor: activo ? "var(--color-superficie)" : "transparent",
                borderLeft: activo
                  ? "2px solid var(--color-texto)"
                  : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* CERRAR SESIÓN */}
      <div style={{
        padding: "16px 20px",
        borderTop: "0.5px solid var(--color-borde)",
      }}>
        <button
          onClick={cerrarSesion}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            border: "0.5px solid var(--color-texto)",
            borderRadius: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
