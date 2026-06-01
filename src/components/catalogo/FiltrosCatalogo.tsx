"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface Props {
  materiales: string[]
  materialActivo?: string
  ordenActivo?: string
  busquedaActiva?: string
}

export default function FiltrosCatalogo({ materiales, materialActivo, ordenActivo, busquedaActiva }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState(busquedaActiva ?? "")
  const montado = useRef(false)

  useEffect(() => {
    if (!montado.current) {
      montado.current = true
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (busqueda) {
        params.set("busqueda", busqueda)
      } else {
        params.delete("busqueda")
      }
      params.delete("page")
      router.replace(`/catalogo?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  function navegar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) {
      params.set(clave, valor)
    } else {
      params.delete(clave)
    }
    params.delete("page")
    router.push(`/catalogo?${params.toString()}`)
  }

  function limpiar() {
    setBusqueda("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("material")
    params.delete("orden")
    params.delete("busqueda")
    params.delete("page")
    router.push(`/catalogo?${params.toString()}`)
  }

  const materialActivoNorm = materialActivo
    ? materialActivo.charAt(0).toUpperCase() + materialActivo.slice(1).toLowerCase()
    : ""

  const hayFiltros = !!(materialActivo || ordenActivo || busqueda)

  const estiloSelect = {
    padding: "8px 12px",
    fontSize: "11px",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    letterSpacing: "0.06em",
    backgroundColor: "var(--color-fondo)",
    border: "1px solid var(--color-texto-muted)",
    borderRadius: 0,
    color: "var(--color-texto)",
    outline: "none",
    cursor: "pointer",
    minWidth: "150px",
  } as React.CSSProperties

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{
            ...estiloSelect,
            cursor: "text",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        />
      </div>

      {materiales.length > 0 && (
        <select
          value={materialActivoNorm}
          onChange={(e) => navegar("material", e.target.value)}
          style={estiloSelect}
        >
          <option value="">Material</option>
          {materiales.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}

      <select
        value={ordenActivo ?? ""}
        onChange={(e) => navegar("orden", e.target.value)}
        style={estiloSelect}
      >
        <option value="">Precio</option>
        <option value="precio_asc">De menor a mayor</option>
        <option value="precio_desc">De mayor a menor</option>
      </select>

      {hayFiltros && (
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
            border: "1px solid var(--color-texto-muted)",
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
