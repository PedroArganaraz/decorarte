"use client"

import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"
import { useState } from "react"
import SidebarPanel from "./SidebarPanel"

const STORAGE_KEY = "panel-sidebar-colapsado"

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  const { esMobile } = useTamanioPantalla()
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [colapsado, setColapsado] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem(STORAGE_KEY) === "true" } catch {}
    }
    return false
  })

  const toggleColapso = () => {
    setColapsado((prev) => {
      const nuevo = !prev
      try { localStorage.setItem(STORAGE_KEY, String(nuevo)) } catch {}
      return nuevo
    })
  }

  const anchoSidebar = esMobile ? "220px" : colapsado ? "60px" : "220px"

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "var(--color-superficie)",
    }}>
      {/* OVERLAY MOBILE */}
      {esMobile && sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(44, 44, 42, 0.4)",
            zIndex: 40,
          }}
        />
      )}

      {/* SIDEBAR WRAPPER — controla ancho y transición */}
      <div suppressHydrationWarning style={{
        width: anchoSidebar,
        flexShrink: 0,
        position: esMobile ? "fixed" : "sticky",
        top: 0,
        height: "100vh",
        left: esMobile ? (sidebarAbierto ? 0 : "-220px") : "auto",
        zIndex: esMobile ? 50 : "auto",
        transition: esMobile ? "left 0.25s ease" : "width 0.25s ease",
        overflow: "hidden",
      }}>
        <SidebarPanel
          onCerrar={() => setSidebarAbierto(false)}
          colapsado={!esMobile && colapsado}
          onToggleColapso={toggleColapso}
        />
      </div>

      {/* CONTENIDO PRINCIPAL — se ajusta automáticamente con flex */}
      <main style={{
        flex: 1,
        padding: esMobile ? "16px" : "32px",
        backgroundColor: "var(--color-superficie)",
        minWidth: 0,
      }}>
        {esMobile && (
          <button
            onClick={() => setSidebarAbierto(true)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <span style={{ display: "block", width: "20px", height: "1px", backgroundColor: "var(--color-texto)" }} />
            <span style={{ display: "block", width: "14px", height: "1px", backgroundColor: "var(--color-texto)" }} />
            <span style={{ display: "block", width: "20px", height: "1px", backgroundColor: "var(--color-texto)" }} />
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
