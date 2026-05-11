"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Package,
  Tag,
  Layers,
  Receipt,
  ShoppingBag,
  BarChart2,
  LogOut,
  Minus,
} from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/cliente"
import type { LucideIcon } from "lucide-react"

const navegacion: { label: string; href: string; Icono: LucideIcon }[] = [
  { label: "Inicio",      href: "/panel",             Icono: Home },
  { label: "Productos",   href: "/panel/productos",   Icono: Package },
  { label: "Ventas",      href: "/ventas",             Icono: ShoppingBag },
  { label: "Gastos",      href: "/gastos",             Icono: Receipt },
  { label: "Categorías",  href: "/panel/categorias",  Icono: Tag },
  { label: "Materiales",  href: "/panel/materiales",  Icono: Layers },
  { label: "Reportes",    href: "/reportes",           Icono: BarChart2 },
]

interface Props {
  onCerrar?: () => void
  colapsado?: boolean
  onToggleColapso?: () => void
}

export default function SidebarPanel({
  onCerrar,
  colapsado = false,
  onToggleColapso,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const cerrarSesion = async () => {
    const supabase = crearClienteNavegador()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside style={{
      width: "100%",
      height: "100vh",
      backgroundColor: "var(--color-card)",
      borderRight: "0.5px solid var(--color-borde)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>

      {/* HEADER: logo + botón colapsar */}
      <div style={{
        borderBottom: "0.5px solid var(--color-borde)",
        display: "flex",
        alignItems: "stretch",
        minHeight: "64px",
      }}>
        {!colapsado && (
          <Link href="/" style={{
            textDecoration: "none",
            flex: 1,
            minWidth: 0,
            padding: "14px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 400,
              letterSpacing: "0.2em",
              color: "var(--color-texto)",
              display: "block",
              whiteSpace: "nowrap",
            }}>
              DECORARTE
            </span>
            <span style={{
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-texto-sutil)",
              marginTop: "4px",
              display: "block",
              whiteSpace: "nowrap",
            }}>
              Panel de gestión
            </span>
          </Link>
        )}

        <button
          onClick={onToggleColapso}
          title={colapsado ? "Expandir sidebar" : "Colapsar sidebar"}
          style={{
            backgroundColor: "var(--color-card)",
            border: "none",
            borderLeft: colapsado ? "none" : "0.5px solid var(--color-borde)",
            cursor: "pointer",
            padding: "16px 12px",
            color: "#3D3835",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0,
            flex: colapsado ? 1 : undefined,
          }}
        >
          {colapsado
            ? <ChevronRight size={15} strokeWidth={1.5} />
            : <ChevronLeft size={15} strokeWidth={1.5} />
          }
        </button>
      </div>

      {/* NAVEGACIÓN */}
      <nav style={{
        flex: 1,
        padding: colapsado ? "2px 0" : "2px 12px",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {navegacion.map(({ label, href, Icono: IconoItem = Minus }) => {
          const activo = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onCerrar}
              title={colapsado ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: colapsado ? "center" : "flex-start",
                gap: "8px",
                padding: colapsado ? "13px 0" : "10px 20px",
                fontSize: "11px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: activo ? 500 : 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: activo ? "var(--color-texto)" : "var(--color-texto-muted)",
                backgroundColor: activo ? "var(--color-superficie)" : "transparent",
                borderLeft: activo && !colapsado
                  ? "2px solid var(--color-texto)"
                  : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              <IconoItem size={colapsado ? 17 : 13} strokeWidth={1.5} />
              {!colapsado && label}
            </Link>
          )
        })}
      </nav>

      {/* CERRAR SESIÓN */}
      <div style={{
        padding: colapsado ? "16px 0" : "20px 24px 0",
        borderTop: "0.5px solid var(--color-borde)",
        display: "flex",
        justifyContent: colapsado ? "center" : "stretch",
      }}>
        {colapsado ? (
          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--color-texto-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <LogOut size={17} strokeWidth={1.5} />
          </button>
        ) : (
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}
