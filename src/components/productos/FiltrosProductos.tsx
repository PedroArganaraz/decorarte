"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import type { Categoria } from "@prisma/client"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"

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

  const aplicar = () => {
    const params = new URLSearchParams()
    if (nombre) params.set("nombre", nombre)
    if (categoriaId) params.set("categoriaId", categoriaId)
    if (soloActivos) params.set("soloActivos", "1")
    router.push(`/panel/productos?${params.toString()}`)
  }

  const limpiar = () => {
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
        onKeyDown={(e) => e.key === "Enter" && aplicar()}
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

      <button
        onClick={aplicar}
        style={{
          padding: "8px 20px",
          fontSize: "11px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backgroundColor: "var(--color-texto)",
          color: "var(--color-fondo)",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        Filtrar
      </button>

      {(nombre || categoriaId) && (
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
