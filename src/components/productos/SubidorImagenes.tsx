"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ImagenProducto } from "@prisma/client"

interface Props {
  productoId: string
  imagenesActuales: ImagenProducto[]
}

export default function SubidorImagenes({ productoId, imagenesActuales }: Props) {
  const [imagenes, setImagenes] = useState<ImagenProducto[]>(imagenesActuales)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [ajustando, setAjustando] = useState<string | null>(null)
  const [posicionTemp, setPosicionTemp] = useState(50)
  const [guardandoPosicion, setGuardandoPosicion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const subirArchivo = async (archivo: File) => {
    const formData = new FormData()
    formData.append("archivo", archivo)
    formData.append("esPrincipal", imagenes.length === 0 ? "true" : "false")

    const res = await fetch(`/api/productos/${productoId}/imagenes`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al subir la imagen")
      return
    }

    setImagenes((prev) => [...prev, data.datos])
    toast.success("Imagen subida correctamente")
    router.refresh()
  }

  const manejarArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return
    setSubiendo(true)
    for (const archivo of Array.from(archivos)) {
      await subirArchivo(archivo)
    }
    setSubiendo(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const eliminarImagen = async (imagenId: string) => {
    setEliminando(imagenId)
    const res = await fetch(
      `/api/productos/${productoId}/imagenes?imagenId=${imagenId}`,
      { method: "DELETE" }
    )
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Error al eliminar la imagen")
      setEliminando(null)
      return
    }

    setImagenes((prev) => prev.filter((img) => img.id !== imagenId))
    toast.success("Imagen eliminada")
    router.refresh()
    setEliminando(null)
  }

  const marcarPrincipal = async (imagenId: string) => {
    const res = await fetch(`/api/productos/${productoId}/imagenes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagenId }),
    })

    if (res.ok) {
      setImagenes((prev) =>
        prev.map((img) => ({ ...img, esPrincipal: img.id === imagenId }))
      )
      toast.success("Imagen principal actualizada")
      router.refresh()
    }
  }

  const abrirAjuste = (img: ImagenProducto) => {
    setAjustando(img.id)
    setPosicionTemp(img.posicion ?? 50)
  }

  const guardarPosicion = async () => {
    if (!ajustando) return
    setGuardandoPosicion(true)
    const res = await fetch(`/api/productos/${productoId}/imagenes/${ajustando}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posicion: posicionTemp }),
    })
    if (res.ok) {
      setImagenes((prev) =>
        prev.map((img) => img.id === ajustando ? { ...img, posicion: posicionTemp } : img)
      )
      toast.success("Posición guardada")
      router.refresh()
    } else {
      toast.error("Error al guardar la posición")
    }
    setGuardandoPosicion(false)
    setAjustando(null)
  }

  const reordenarImagenes = async (origenId: string, destinoId: string) => {
    const lista = [...imagenes]
    const origenIdx = lista.findIndex((img) => img.id === origenId)
    const destinoIdx = lista.findIndex((img) => img.id === destinoId)
    const [movida] = lista.splice(origenIdx, 1)
    lista.splice(destinoIdx, 0, movida)
    const actualizadas = lista.map((img, idx) => ({ ...img, orden: idx }))
    setImagenes(actualizadas)
    await fetch(`/api/productos/${productoId}/imagenes/orden`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagenes: actualizadas.map((img) => ({ id: img.id, orden: img.orden })) }),
    })
    router.refresh()
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (id !== draggingId) setDragOverId(id)
  }

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null)
  }

  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggingId && draggingId !== id) reordenarImagenes(draggingId, id)
    setDraggingId(null)
    setDragOverId(null)
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const manejarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    manejarArchivos(e.dataTransfer.files)
  }

  const imagenAjustando = ajustando ? imagenes.find((img) => img.id === ajustando) : null

  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "0.5px solid var(--color-borde)",
      padding: "24px",
    }}>

      {ajustando && imagenAjustando && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            padding: "24px",
            width: "min(480px, 90vw)",
          }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 400,
              color: "var(--color-texto)",
              marginBottom: "16px",
            }}>
              Ajustar posición
            </h3>

            <div style={{
              position: "relative",
              aspectRatio: "1",
              overflow: "hidden",
              border: "0.5px solid var(--color-borde)",
              marginBottom: "20px",
              backgroundColor: "var(--color-superficie)",
            }}>
              <img
                src={imagenAjustando.urlPublica}
                alt={imagenAjustando.altText || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${posicionTemp}%`,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Arriba
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={posicionTemp}
                onChange={(e) => setPosicionTemp(Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--color-texto)", cursor: "pointer" }}
              />
              <span style={{ fontSize: "10px", fontFamily: "'Jost', sans-serif", color: "var(--color-texto-sutil)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Abajo
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setAjustando(null)}
                disabled={guardandoPosicion}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "10px",
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "transparent",
                  color: "var(--color-texto-muted)",
                  border: "0.5px solid var(--color-borde)",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarPosicion}
                disabled={guardandoPosicion}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "10px",
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "var(--color-texto)",
                  color: "var(--color-fondo)",
                  border: "none",
                  cursor: guardandoPosicion ? "not-allowed" : "pointer",
                  opacity: guardandoPosicion ? 0.6 : 1,
                }}
              >
                {guardandoPosicion ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "18px",
        fontWeight: 400,
        color: "var(--color-texto)",
        marginBottom: "20px",
      }}>
        Imágenes
      </h2>

      {imagenes.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}>
          {imagenes.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => onDragStart(e, img.id)}
              onDragOver={(e) => onDragOver(e, img.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, img.id)}
              onDragEnd={onDragEnd}
              style={{
                position: "relative",
                border: dragOverId === img.id
                  ? "2px dashed var(--color-texto)"
                  : img.esPrincipal
                  ? "2px solid var(--color-texto)"
                  : "0.5px solid var(--color-borde)",
                opacity: draggingId === img.id ? 0.35 : 1,
                cursor: "grab",
                transition: "opacity 0.15s",
              }}
            >
              <img
                src={img.urlPublica}
                alt={img.altText || ""}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  objectPosition: `center ${img.posicion ?? 50}%`,
                  display: "block",
                }}
              />
              {img.esPrincipal && (
                <div style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  fontSize: "8px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "var(--color-texto)",
                  color: "var(--color-fondo)",
                  padding: "2px 6px",
                }}>
                  Principal
                </div>
              )}
              <div style={{
                display: "flex",
                flexDirection: "column",
                borderTop: "0.5px solid var(--color-borde)",
              }}>
                <div style={{ display: "flex" }}>
                  {!img.esPrincipal && (
                    <button
                      onClick={() => marcarPrincipal(img.id)}
                      style={{
                        flex: 1,
                        padding: "5px 2px",
                        fontSize: "8px",
                        fontFamily: "'Jost', sans-serif",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        backgroundColor: "transparent",
                        color: "var(--color-texto-muted)",
                        border: "none",
                        borderRight: "0.5px solid var(--color-borde)",
                        cursor: "pointer",
                      }}
                    >
                      Principal
                    </button>
                  )}
                  <button
                    onClick={() => abrirAjuste(img)}
                    style={{
                      flex: 1,
                      padding: "5px 2px",
                      fontSize: "8px",
                      fontFamily: "'Jost', sans-serif",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      backgroundColor: "transparent",
                      color: "var(--color-texto-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Ajustar
                  </button>
                </div>
                <button
                  onClick={() => eliminarImagen(img.id)}
                  disabled={eliminando === img.id}
                  style={{
                    width: "100%",
                    padding: "5px",
                    fontSize: "8px",
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    backgroundColor: "transparent",
                    color: eliminando === img.id ? "var(--color-texto-sutil)" : "#A32D2D",
                    border: "none",
                    borderTop: "0.5px solid var(--color-borde)",
                    cursor: eliminando === img.id ? "not-allowed" : "pointer",
                  }}
                >
                  {eliminando === img.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={manejarDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "0.5px dashed var(--color-borde)",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: subiendo ? "var(--color-superficie)" : "transparent",
          transition: "background-color 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          style={{ display: "none" }}
          onChange={(e) => manejarArchivos(e.target.files)}
        />
        <p style={{
          fontSize: "12px",
          color: "var(--color-texto-muted)",
          letterSpacing: "0.05em",
          marginBottom: "4px",
        }}>
          {subiendo ? "Subiendo..." : "Arrastrá imágenes o hacé clic para seleccionar"}
        </p>
        <p style={{
          fontSize: "10px",
          color: "var(--color-texto-sutil)",
          letterSpacing: "0.05em",
        }}>
          JPG, PNG, WebP o AVIF — máx. 5MB por imagen
        </p>
      </div>
    </div>
  )
}
