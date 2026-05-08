"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"
import IconoCarrito from "@/components/carrito/IconoCarrito"
import { crearClienteNavegador } from "@/lib/supabase/cliente"

export default function Encabezado() {
  const { esMobile } = useTamanioPantalla()
  const [menuAbierto, setMenuAbierto] = useState(false)
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
      {/* FILA PRINCIPAL */}
      <div style={{
        display: "grid",
        gridTemplateColumns: esMobile ? "40px 1fr 40px" : "1fr auto 1fr",
        alignItems: "center",
        padding: esMobile ? "14px 16px" : "16px 24px 12px",
      }}>
        {/* IZQUIERDA */}
        {esMobile ? (
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--color-texto)",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              alignItems: "flex-start",
            }}
            aria-label="Menú"
          >
            <span style={{
              display: "block",
              width: "20px",
              height: "1px",
              backgroundColor: "var(--color-texto)",
              transition: "transform 0.2s",
              transform: menuAbierto ? "rotate(45deg) translate(4px, 4px)" : "none",
            }} />
            <span style={{
              display: "block",
              width: "14px",
              height: "1px",
              backgroundColor: "var(--color-texto)",
              opacity: menuAbierto ? 0 : 1,
              transition: "opacity 0.2s",
            }} />
            <span style={{
              display: "block",
              width: "20px",
              height: "1px",
              backgroundColor: "var(--color-texto)",
              transition: "transform 0.2s",
              transform: menuAbierto ? "rotate(-45deg) translate(4px, -4px)" : "none",
            }} />
          </button>
        ) : (
          <div />
        )}

        {/* LOGO CENTRADO */}
        <Link href="/" style={{ textDecoration: "none", textAlign: "center" }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: esMobile ? "20px" : "24px",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: "var(--color-texto)",
            display: "block",
          }}>
            DECORARTE
          </span>
        </Link>

        {/* ÍCONOS DERECHA */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
        }}>
          {!esMobile && (
            <Link
              href={tieneSesion ? "/panel" : "/auth/login"}
              style={{ color: "var(--color-texto)", display: "flex", alignItems: "center" }}
              aria-label="Acceso vendedoras"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}
          <IconoCarrito />
        </div>
      </div>

      {/* MENÚ MOBILE DESPLEGABLE */}
      {esMobile && menuAbierto && (
        <nav style={{
          borderTop: "0.5px solid var(--color-borde)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "0",
          backgroundColor: "var(--color-fondo)",
        }}>
          <Link
            href={tieneSesion ? "/panel" : "/auth/login"}
            onClick={() => setMenuAbierto(false)}
            style={{
              fontSize: "13px",
              fontWeight: 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: "var(--color-texto-muted)",
              padding: "14px 8px",
              display: "block",
              marginTop: "8px",
            }}
          >
            {tieneSesion ? "Panel" : "Vendedoras"}
          </Link>
        </nav>
      )}
    </header>
  )
}
