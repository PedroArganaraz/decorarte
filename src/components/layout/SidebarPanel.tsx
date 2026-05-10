"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/cliente"
import type { LucideIcon } from "lucide-react"

const navegacion: { label: string; href: string; Icono?: LucideIcon }[] = [
  { label: "Inicio", href: "/panel" },
  { label: "Productos", href: "/panel/productos" },
  { label: "Categorías", href: "/panel/categorias" },
  { label: "Materiales", href: "/panel/materiales" },
  { label: "Nueva venta", href: "/ventas/nueva", Icono: ShoppingCart },
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
      height: "100vh",
      backgroundColor: "var(--color-card)",
      borderRight: "0.5px solid var(--color-borde)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 0",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      overflowY: "auto",
    }}>
      {/* LOGO */}
      <div style={{
        padding: "16px 20px",
        paddingBottom: "16px",
        borderBottom: "0.5px solid var(--color-borde)",
        marginBottom: "0",
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
        padding: "0 12px",
      }}>
        {navegacion.map(({ label, href, Icono }) => {
          const activo = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onCerrar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
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
              {Icono && <Icono size={13} strokeWidth={1.5} />}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* CERRAR SESIÓN */}
      <div style={{
        padding: "24px 24px 0",
        borderTop: "0.5px solid var(--color-borde)",
        marginTop: "auto",
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
