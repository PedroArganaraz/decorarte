"use client"

import { useState, useEffect } from "react"

export function useTamanioPantalla() {
  const [ancho, setAncho] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  )

  useEffect(() => {
    const manejarCambio = () => setAncho(window.innerWidth)
    window.addEventListener("resize", manejarCambio)
    return () => window.removeEventListener("resize", manejarCambio)
  }, [])

  return {
    esMobile: ancho < 768,
    esTablet: ancho >= 768 && ancho < 1024,
    esDesktop: ancho >= 1024,
    ancho,
  }
}
