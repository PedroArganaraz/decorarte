"use client"

import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"
import { useState } from "react"
import SidebarPanel from "./SidebarPanel"

export default function LayoutPanel({
  children,
}: {
  children: React.ReactNode
}) {
  const { esMobile } = useTamanioPantalla()
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

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

      {/* SIDEBAR */}
      <div style={{
        position: esMobile ? "fixed" : "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        left: esMobile ? (sidebarAbierto ? 0 : "-220px") : "auto",
        zIndex: esMobile ? 50 : "auto",
        transition: "left 0.25s ease",
      }}>
        <SidebarPanel onCerrar={() => setSidebarAbierto(false)} />
      </div>

      {/* CONTENIDO */}
      <main style={{
        flex: 1,
        padding: esMobile ? "16px" : "32px",
        backgroundColor: "var(--color-superficie)",
        minWidth: 0,
      }}>
        {/* BOTÓN HAMBURGER MOBILE */}
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
