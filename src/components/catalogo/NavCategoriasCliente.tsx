"use client"

import { useState, useRef } from "react"
import Link from "next/link"

interface Material {
  id: string
  nombre: string
}

interface CategoriaConMateriales {
  id: string
  nombre: string
  slug: string
  materiales: Material[]
}

interface Props {
  categorias: CategoriaConMateriales[]
  categoriaActiva?: string
  materialActivo?: string
  todosActivo?: boolean
}

export default function NavCategoriasCliente({
  categorias,
  categoriaActiva,
  materialActivo,
  todosActivo,
}: Props) {
  // displayId: qué categoría está visible en el submenú (incluye durante la salida)
  // isExiting: true mientras se reproduce la animación de cierre
  const [displayId, setDisplayId] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categoriaSubMenu = categorias.find((c) => c.id === displayId)

  function cancelarCierre() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }

  function cancelarSalida() {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    setIsExiting(false)
  }

  function abrirCategoria(id: string | null) {
    cancelarCierre()
    cancelarSalida()
    setIsExiting(false)
    setDisplayId(id)
  }

  function programarCierre() {
    closeTimerRef.current = setTimeout(() => {
      // Inicia animación de salida; desmonta después de que termina
      setIsExiting(true)
      exitTimerRef.current = setTimeout(() => {
        setDisplayId(null)
        setIsExiting(false)
      }, 250)
    }, 150)
  }

  function handleMouseEnter(cat: CategoriaConMateriales) {
    abrirCategoria(cat.materiales.length > 0 ? cat.id : null)
  }

  function toggleSubmenu(catId: string) {
    if (displayId === catId && !isExiting) {
      setIsExiting(true)
      exitTimerRef.current = setTimeout(() => {
        setDisplayId(null)
        setIsExiting(false)
      }, 250)
    } else {
      abrirCategoria(catId)
    }
  }

  function handleSubMenuEnter() {
    cancelarCierre()
    cancelarSalida()
  }

  const estiloLink = (activo: boolean): React.CSSProperties => ({
    padding: "12px 20px",
    fontSize: "11px",
    fontWeight: activo ? 500 : 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    textDecoration: "none",
    color: "var(--color-texto)",
    borderBottom: activo ? "2px solid var(--color-texto)" : "2px solid transparent",
    whiteSpace: "nowrap",
    marginBottom: "-0.5px",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
  })

  const estiloMaterial = (activo: boolean): React.CSSProperties => ({
    padding: "10px 24px",
    fontSize: "10px",
    fontWeight: activo ? 500 : 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    textDecoration: "none",
    color: "var(--color-texto)",
    borderBottom: activo ? "2px solid var(--color-texto)" : "2px solid transparent",
    whiteSpace: "nowrap",
    marginBottom: "-0.5px",
    display: "inline-block",
  })

  return (
    <>
      <style>{`
        @keyframes submenu-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes submenu-out {
          from { opacity: 1; transform: translateY(0);    }
          to   { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>

      <div
        style={{
          borderBottom: "0.5px solid var(--color-borde)",
          backgroundColor: "var(--color-fondo)",
          position: "sticky",
          top: "57px",
          zIndex: 10,
        }}
        onMouseLeave={programarCierre}
      >
        {/* Fila principal de categorías */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <Link
            href="/catalogo"
            style={estiloLink(!!todosActivo)}
            onMouseEnter={() => abrirCategoria(null)}
          >
            Todos
          </Link>

          {categorias.map((cat) => {
            const estaActiva = categoriaActiva === cat.slug
            const tieneSubmenu = cat.materiales.length > 0
            const submenuAbierto = displayId === cat.id && !isExiting

            if (!tieneSubmenu) {
              return (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.slug}`}
                  style={estiloLink(estaActiva)}
                  onMouseEnter={() => handleMouseEnter(cat)}
                >
                  {cat.nombre}
                </Link>
              )
            }

            return (
              <div
                key={cat.id}
                style={{ display: "inline-flex", alignItems: "stretch" }}
                onMouseEnter={() => handleMouseEnter(cat)}
              >
                <Link
                  href={`/catalogo?categoria=${cat.slug}`}
                  style={{ ...estiloLink(estaActiva), paddingRight: "4px" }}
                >
                  {cat.nombre}
                </Link>
                <button
                  onClick={() => toggleSubmenu(cat.id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: estaActiva ? "2px solid var(--color-texto)" : "2px solid transparent",
                    marginBottom: "-0.5px",
                    cursor: "pointer",
                    padding: "12px 12px 12px 4px",
                    display: "inline-flex",
                    alignItems: "center",
                    color: "var(--color-texto)",
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      opacity: 0.45,
                      transform: submenuAbierto ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>

        {/* Submenú de materiales */}
        {categoriaSubMenu && categoriaSubMenu.materiales.length > 0 && (
          <div
            style={{
              borderTop: "0.5px solid var(--color-borde)",
              backgroundColor: "var(--color-fondo)",
              animation: `${isExiting ? "submenu-out" : "submenu-in"} 250ms ease forwards`,
            }}
            onMouseEnter={handleSubMenuEnter}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "0 24px",
                display: "flex",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {categoriaSubMenu.materiales.map((mat) => (
                <Link
                  key={mat.id}
                  href={`/catalogo?categoria=${categoriaSubMenu.slug}&material=${encodeURIComponent(mat.nombre)}`}
                  style={estiloMaterial(
                    mat.nombre.toLowerCase() === materialActivo?.toLowerCase() && categoriaSubMenu.slug === categoriaActiva
                  )}
                >
                  {mat.nombre}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
