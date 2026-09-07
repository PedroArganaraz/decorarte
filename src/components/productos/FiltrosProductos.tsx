"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import type { Categoria } from "@prisma/client"
import { useTamanioPantalla } from "@/hooks/useTamanioPantalla"

const STORAGE_KEY = "filtros-productos"

interface Props {
  categorias: Categoria[]
  materiales: string[]
}

export default function FiltrosProductos({ categorias, materiales }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nombre, setNombre] = useState(searchParams.get("nombre") ?? "")
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoriaId") ?? "")
  const [soloActivos, setSoloActivos] = useState(searchParams.get("soloActivos") ?? "")
  const [material, setMaterial] = useState(searchParams.get("material") ?? "")
  const [orden, setOrden] = useState(searchParams.get("orden") ?? "")
  const [fechaDesde, setFechaDesde] = useState(searchParams.get("fechaDesde") ?? "")
  const [fechaHasta, setFechaHasta] = useState(searchParams.get("fechaHasta") ?? "")
  const [materialesFiltrados, setMaterialesFiltrados] = useState<string[]>(materiales)
  const { esMobile } = useTamanioPantalla()
  const inicializado = useRef(false)

  // Restaurar desde localStorage al montar si la URL no tiene parámetros.
  useEffect(() => {
    const tieneParams =
      searchParams.get("nombre") ||
      searchParams.get("categoriaId") ||
      searchParams.get("soloActivos") ||
      searchParams.get("material") ||
      searchParams.get("orden") ||
      searchParams.get("fechaDesde") ||
      searchParams.get("fechaHasta")
    if (!tieneParams) {
      try {
        const guardados = localStorage.getItem(STORAGE_KEY)
        if (guardados) {
          const parsed = JSON.parse(guardados) as {
            nombre?: string
            categoriaId?: string
            soloActivos?: string
            material?: string
            orden?: string
            fechaDesde?: string
            fechaHasta?: string
          }
          const n = parsed.nombre ?? ""
          const c = parsed.categoriaId ?? ""
          const s = parsed.soloActivos ?? ""
          const m = parsed.material ?? ""
          const o = parsed.orden ?? ""
          const fd = parsed.fechaDesde ?? ""
          const fh = parsed.fechaHasta ?? ""
          setNombre(n)
          setCategoriaId(c)
          setSoloActivos(s)
          setMaterial(m)
          setOrden(o)
          setFechaDesde(fd)
          setFechaHasta(fh)
          const params = new URLSearchParams()
          if (n) params.set("nombre", n)
          if (c) params.set("categoriaId", c)
          if (s) params.set("soloActivos", s)
          if (m) params.set("material", m)
          if (o) params.set("orden", o)
          if (fd) params.set("fechaDesde", fd)
          if (fh) params.set("fechaHasta", fh)
          const qs = params.toString()
          if (qs) router.push(`/panel/productos?${qs}`)
        }
      } catch {}
    }
    setTimeout(() => { inicializado.current = true }, 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar en localStorage al cambiar cualquier filtro
  useEffect(() => {
    if (!inicializado.current) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nombre, categoriaId, soloActivos, material, orden, fechaDesde, fechaHasta })
      )
    } catch {}
  }, [nombre, categoriaId, soloActivos, material, orden, fechaDesde, fechaHasta])

  useEffect(() => {
    const controller = new AbortController()
    const url = categoriaId
      ? `/api/materiales?source=productos&categoriaId=${categoriaId}`
      : `/api/materiales?source=productos`
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const lista: string[] = data.datos ?? []
        setMaterialesFiltrados(lista)
        setMaterial((prev) => (lista.includes(prev) ? prev : ""))
      })
      .catch((err) => { if (err.name !== "AbortError") console.error(err) })
    return () => controller.abort()
  }, [categoriaId]) // eslint-disable-line react-hooks/exhaustive-deps

  function buildParams() {
    const params = new URLSearchParams()
    if (nombre) params.set("nombre", nombre)
    if (categoriaId) params.set("categoriaId", categoriaId)
    if (soloActivos) params.set("soloActivos", soloActivos)
    if (material) params.set("material", material)
    if (orden) params.set("orden", orden)
    if (fechaDesde) params.set("fechaDesde", fechaDesde)
    if (fechaHasta) params.set("fechaHasta", fechaHasta)
    return params
  }

  // Auto-apply: texto con debounce 300ms
  useEffect(() => {
    if (!inicializado.current) return
    const timer = setTimeout(() => {
      router.push(`/panel/productos?${buildParams().toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [nombre]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply: selects de forma inmediata
  useEffect(() => {
    if (!inicializado.current) return
    router.push(`/panel/productos?${buildParams().toString()}`)
  }, [categoriaId, soloActivos, material, orden]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fechas: aplicar con los valores nuevos explícitos para evitar estado stale
  const aplicarFechaFiltro = (nuevoDesde: string, nuevoHasta: string) => {
    if (!inicializado.current) return
    const params = new URLSearchParams()
    if (nombre) params.set("nombre", nombre)
    if (categoriaId) params.set("categoriaId", categoriaId)
    if (soloActivos) params.set("soloActivos", soloActivos)
    if (material) params.set("material", material)
    if (orden) params.set("orden", orden)
    if (nuevoDesde) params.set("fechaDesde", nuevoDesde)
    if (nuevoHasta) params.set("fechaHasta", nuevoHasta)
    router.push(`/panel/productos?${params.toString()}`)
  }

  const limpiar = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setNombre("")
    setCategoriaId("")
    setSoloActivos("")
    setMaterial("")
    setOrden("")
    setFechaDesde("")
    setFechaHasta("")
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
    <div style={{ marginBottom: "20px" }}>
    <style>{`
      .fecha-filtro-vacia::-webkit-datetime-edit-fields-wrapper { visibility: hidden; }
    `}</style>
    <p style={{
      fontSize: "10px",
      fontFamily: "'Jost', sans-serif",
      fontWeight: 500,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--color-texto-muted)",
      marginBottom: "10px",
    }}>
      Filtros
    </p>
    <div style={{
      display: "flex",
      gap: "10px",
      alignItems: esMobile ? "stretch" : "center",
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

      {materialesFiltrados.length > 0 && (
        <select
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={{ ...estiloInput, minWidth: "150px", width: esMobile ? "100%" : "auto" }}
        >
          <option value="">Material</option>
          {materialesFiltrados.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      )}

      <select
        value={orden}
        onChange={(e) => setOrden(e.target.value)}
        style={{ ...estiloInput, minWidth: "130px", width: esMobile ? "100%" : "auto" }}
      >
        <option value="">Precio</option>
        <option value="precio_asc">De menor a mayor</option>
        <option value="precio_desc">De mayor a menor</option>
      </select>

      <div style={{ position: "relative", width: esMobile ? "100%" : "auto" }}>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => {
            const v = e.target.value
            setFechaDesde(v)
            aplicarFechaFiltro(v, fechaHasta)
          }}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          className={!fechaDesde ? "fecha-filtro-vacia" : undefined}
          style={{ ...estiloInput, width: "100%", cursor: "pointer" }}
        />
        {!fechaDesde && (
          <span style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            color: "var(--color-texto-muted)",
            pointerEvents: "none",
          }}>
            Fecha desde
          </span>
        )}
      </div>

      <div style={{ position: "relative", width: esMobile ? "100%" : "auto" }}>
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => {
            const v = e.target.value
            setFechaHasta(v)
            aplicarFechaFiltro(fechaDesde, v)
          }}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          className={!fechaHasta ? "fecha-filtro-vacia" : undefined}
          style={{ ...estiloInput, width: "100%", cursor: "pointer" }}
        />
        {!fechaHasta && (
          <span style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            color: "var(--color-texto-muted)",
            pointerEvents: "none",
          }}>
            Fecha hasta
          </span>
        )}
      </div>

      <select
        value={soloActivos}
        onChange={(e) => setSoloActivos(e.target.value)}
        style={{ ...estiloInput, minWidth: "140px", width: esMobile ? "100%" : "auto" }}
      >
        <option value="">Estado</option>
        <option value="activo">Solo activos</option>
        <option value="inactivo">Solo inactivos</option>
      </select>

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
    </div>
    </div>
  )
}
