"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import type { Categoria } from "@prisma/client"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"

const STORAGE_KEY = "filtros-productos"

interface Props {
  categorias: Categoria[]
}

export default function FiltrosProductos({ categorias }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nombre, setNombre] = useState(searchParams.get("nombre") ?? "")
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoriaId") ?? "")
  const [soloActivos, setSoloActivos] = useState(searchParams.get("soloActivos") === "1")
  const { esMobile } = useTamanioPantalla()
  const inicializado = useRef(false)

  // Restaurar desde localStorage al montar si la URL no tiene parámetros.
  // inicializado se activa con setTimeout(0) para que los efectos de auto-apply
  // no se disparen con los setState del restore (se dispararían antes del tick).
  useEffect(() => {
    const tieneParams = searchParams.get("nombre") || searchParams.get("categoriaId") || searchParams.get("soloActivos")
    if (!tieneParams) {
      try {
        const guardados = localStorage.getItem(STORAGE_KEY)
        if (guardados) {
          const parsed = JSON.parse(guardados) as { nombre?: string; categoriaId?: string; soloActivos?: boolean }
          const n = parsed.nombre ?? ""
          const c = parsed.categoriaId ?? ""
          const s = parsed.soloActivos ?? false
          setNombre(n)
          setCategoriaId(c)
          setSoloActivos(s)
          const params = new URLSearchParams()
          if (n) params.set("nombre", n)
          if (c) params.set("categoriaId", c)
          if (s) params.set("soloActivos", "1")
          const qs = params.toString()
          if (qs) router.push(`/panel/productos?${qs}`)
        }
      } catch {}
    }
    setTimeout(() => { inicializado.current = true }, 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar en localStorage al cambiar cualquier filtro (solo tras inicialización)
  useEffect(() => {
    if (!inicializado.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nombre, categoriaId, soloActivos }))
    } catch {}
  }, [nombre, categoriaId, soloActivos])

  // Auto-apply: texto con debounce 300ms
  useEffect(() => {
    if (!inicializado.current) return
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (nombre) params.set("nombre", nombre)
      if (categoriaId) params.set("categoriaId", categoriaId)
      if (soloActivos) params.set("soloActivos", "1")
      router.push(`/panel/productos?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [nombre]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply: categoría y checkbox de forma inmediata
  useEffect(() => {
    if (!inicializado.current) return
    const params = new URLSearchParams()
    if (nombre) params.set("nombre", nombre)
    if (categoriaId) params.set("categoriaId", categoriaId)
    if (soloActivos) params.set("soloActivos", "1")
    router.push(`/panel/productos?${params.toString()}`)
  }, [categoriaId, soloActivos]) // eslint-disable-line react-hooks/exhaustive-deps

  const limpiar = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setNombre("")
    setCategoriaId("")
    setSoloActivos(false)
    router.push("/panel/productos")
  }

  const estiloInput = {
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    backgroundColor: "var(--color-card)",
    border: "0.5px solid var(--color-borde)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
  } as React.CSSProperties

  return (
    <div style={{
      display: "flex",
      gap: "10px",
      alignItems: esMobile ? "stretch" : "center",
      marginBottom: "20px",
      flexDirection: esMobile ? "column" : "row",
      flexWrap: "wrap",
    }}>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault() } }}
        placeholder="Buscar por nombre..."
        style={{ ...estiloInput, minWidth: "200px", width: esMobile ? "100%" : "auto" }}
      />

      <select
        value={categoriaId}
        onChange={(e) => setCategoriaId(e.target.value)}
        style={{ ...estiloInput, minWidth: "160px", width: esMobile ? "100%" : "auto" }}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.nombre}
          </option>
        ))}
      </select>

      <label style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontSize: "11px",
        fontFamily: "'Jost', sans-serif",
        letterSpacing: "0.08em",
        color: "var(--color-texto)",
        userSelect: "none",
      }}>
        <input
          type="checkbox"
          checked={soloActivos}
          onChange={(e) => setSoloActivos(e.target.checked)}
          style={{ width: "13px", height: "13px", cursor: "pointer", accentColor: "var(--color-texto)" }}
        />
        Solo activos
      </label>

      {(nombre || categoriaId || soloActivos) && (
        <button
          onClick={limpiar}
          style={{
            padding: "8px 16px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            border: "0.5px solid var(--color-texto)",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          Limpiar
        </button>
      )}
    </div>
  )
}
