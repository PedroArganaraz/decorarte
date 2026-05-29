"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ImagenHero {
  id: string
  urlPublica: string
  pathInterno: string
  orden: number
  posicion: number
  activa: boolean
  creadoEn: string
}

interface Props {
  imagenesIniciales: ImagenHero[]
}

export default function GestorHero({ imagenesIniciales }: Props) {
  const [imagenes, setImagenes] = useState<ImagenHero[]>(imagenesIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [slideActual, setSlideActual] = useState(0)
  const [intervalo, setIntervalo] = useState(3)
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDraggingPreview = useRef(false)
  const dragStartY = useRef(0)
  const dragStartPosicion = useRef(50)
  const router = useRouter()

  useEffect(() => {
    const guardado = localStorage.getItem("hero-intervalo")
    if (guardado) setIntervalo(Number(guardado))
  }, [])

  useEffect(() => {
    if (imagenes.length <= 1) return
    const timer = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % imagenes.length)
    }, intervalo * 1000)
    return () => clearInterval(timer)
  }, [imagenes.length, intervalo])

  const cambiarIntervalo = async (segundos: number) => {
    setIntervalo(segundos)
    localStorage.setItem("hero-intervalo", String(segundos))
    await fetch("/api/hero/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalo: segundos }),
    })
  }

  useEffect(() => {
    if (slideActual >= imagenes.length && imagenes.length > 0) {
      setSlideActual(imagenes.length - 1)
    }
  }, [imagenes.length, slideActual])

  const prevSlide = () =>
    setSlideActual((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  const nextSlide = () =>
    setSlideActual((prev) => (prev + 1) % imagenes.length)

  const subirArchivo = async (archivo: File) => {
    const formData = new FormData()
    formData.append("archivo", archivo)
    const res = await fetch("/api/hero", { method: "POST", body: formData })
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

  const eliminarImagen = async (id: string) => {
    setEliminando(id)
    const res = await fetch(`/api/hero/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Error al eliminar la imagen")
      setEliminando(null)
      return
    }
    setImagenes((prev) => prev.filter((img) => img.id !== id))
    setConfirmarEliminar(null)
    toast.success("Imagen eliminada")
    router.refresh()
    setEliminando(null)
  }

  const reordenarImagenes = async (origenId: string, destinoId: string) => {
    const lista = [...imagenes]
    const origenIdx = lista.findIndex((img) => img.id === origenId)
    const destinoIdx = lista.findIndex((img) => img.id === destinoId)
    const [movida] = lista.splice(origenIdx, 1)
    lista.splice(destinoIdx, 0, movida)
    const actualizadas = lista.map((img, idx) => ({ ...img, orden: idx }))
    setImagenes(actualizadas)
    await fetch("/api/hero/orden", {
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

  const actualizarPosicion = (id: string, posicion: number) => {
    setImagenes((prev) =>
      prev.map((img) => (img.id === id ? { ...img, posicion } : img))
    )
  }

  const guardarPosicion = async (id: string, posicion: number) => {
    await fetch(`/api/hero/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posicion }),
    })
  }

  const onPreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const img = imagenes[slideActual]
    if (!img) return
    isDraggingPreview.current = true
    dragStartY.current = e.clientY
    dragStartPosicion.current = img.posicion ?? 50
    e.currentTarget.setPointerCapture(e.pointerId)
    setArrastrando(true)
  }

  const onPreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPreview.current) return
    const img = imagenes[slideActual]
    if (!img) return
    const delta = e.clientY - dragStartY.current
    const newPosicion = Math.max(0, Math.min(100, Math.round(dragStartPosicion.current - delta / 3)))
    actualizarPosicion(img.id, newPosicion)
  }

  const onPreviewPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPreview.current) return
    isDraggingPreview.current = false
    setArrastrando(false)
    const img = imagenes[slideActual]
    if (!img) return
    const delta = e.clientY - dragStartY.current
    const newPosicion = Math.max(0, Math.min(100, Math.round(dragStartPosicion.current - delta / 3)))
    guardarPosicion(img.id, newPosicion)
  }

  const manejarDropZona = (e: React.DragEvent) => {
    e.preventDefault()
    manejarArchivos(e.dataTransfer.files)
  }

  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "var(--color-fondo)" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link href="/panel" style={{
          fontSize: "13px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-texto)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          border: "0.5px solid var(--color-borde)",
          marginBottom: "16px",
        }}>
          ← Volver
        </Link>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
          marginBottom: "4px",
        }}>
          Carrusel hero
        </h1>
        <p style={{
          fontSize: "12px",
          color: "var(--color-texto-muted)",
          letterSpacing: "0.05em",
        }}>
          Imágenes que se muestran en la página de inicio
        </p>
      </div>

      {/* Upload zone */}
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "24px",
        marginBottom: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "18px",
          fontWeight: 400,
          color: "var(--color-texto)",
          marginBottom: "20px",
        }}>
          Agregar imagen
        </h2>
        <div
          onDrop={manejarDropZona}
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

      {/* Configuración */}
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "20px 24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <label style={{
          fontSize: "10px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
          whiteSpace: "nowrap",
        }}>
          Segundos por imagen
        </label>
        <select
          value={intervalo}
          onChange={(e) => cambiarIntervalo(Number(e.target.value))}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto)",
            backgroundColor: "var(--color-fondo)",
            border: "0.5px solid var(--color-borde)",
            cursor: "pointer",
          }}
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Image grid */}
      {imagenes.length > 0 && (
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "0.5px solid var(--color-borde)",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "18px",
            fontWeight: 400,
            color: "var(--color-texto)",
            marginBottom: "20px",
          }}>
            Imágenes del carrusel
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "12px",
          }}>
            {imagenes.map((img, idx) => (
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
                    : "0.5px solid var(--color-borde)",
                  opacity: draggingId === img.id ? 0.35 : 1,
                  cursor: "grab",
                  transition: "opacity 0.15s",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  fontSize: "9px",
                  fontWeight: 500,
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: "0.1em",
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  padding: "2px 6px",
                  zIndex: 1,
                }}>
                  {idx + 1}
                </div>
                <img
                  src={img.urlPublica}
                  alt={`Hero ${idx + 1}`}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    objectPosition: `center ${img.posicion}%`,
                    display: "block",
                  }}
                />
                <div style={{ borderTop: "0.5px solid var(--color-borde)" }}>
                  {confirmarEliminar === img.id ? (
                    <div style={{ display: "flex" }}>
                      <button
                        onClick={() => setConfirmarEliminar(null)}
                        style={{
                          flex: 1,
                          padding: "5px",
                          fontSize: "9px",
                          fontFamily: "'Jost', sans-serif",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          backgroundColor: "transparent",
                          color: "var(--color-texto-muted)",
                          border: "none",
                          borderRight: "0.5px solid var(--color-borde)",
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => eliminarImagen(img.id)}
                        disabled={eliminando === img.id}
                        style={{
                          flex: 1,
                          padding: "5px",
                          fontSize: "9px",
                          fontFamily: "'Jost', sans-serif",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          backgroundColor: "transparent",
                          color: eliminando === img.id ? "var(--color-texto-sutil)" : "#A32D2D",
                          border: "none",
                          cursor: eliminando === img.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {eliminando === img.id ? "..." : "Confirmar"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmarEliminar(img.id)}
                      style={{
                        width: "100%",
                        padding: "5px",
                        fontSize: "9px",
                        fontFamily: "'Jost', sans-serif",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        backgroundColor: "transparent",
                        color: "#A32D2D",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carousel preview */}
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "0.5px solid var(--color-borde)",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "18px",
          fontWeight: 400,
          color: "var(--color-texto)",
          marginBottom: "20px",
        }}>
          Vista previa
        </h2>
        {imagenes.length === 0 ? (
          <div style={{
            aspectRatio: "16/6",
            backgroundColor: "var(--color-superficie)",
            border: "0.5px dashed var(--color-borde)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <p style={{
              fontSize: "11px",
              fontFamily: "'Jost', sans-serif",
              color: "var(--color-texto-sutil)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              Sin imágenes
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                position: "relative",
                aspectRatio: "16/6",
                overflow: "hidden",
                cursor: arrastrando ? "grabbing" : "grab",
                userSelect: "none",
              }}
              onPointerDown={onPreviewPointerDown}
              onPointerMove={onPreviewPointerMove}
              onPointerUp={onPreviewPointerUp}
              onPointerCancel={onPreviewPointerUp}
            >
              <img
                key={imagenes[slideActual]?.id}
                src={imagenes[slideActual]?.urlPublica}
                alt={`Preview ${slideActual + 1}`}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${imagenes[slideActual]?.posicion ?? 50}%`,
                  display: "block",
                  pointerEvents: "none",
                }}
              />
              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide() }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                      fontSize: "20px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide() }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                      fontSize: "20px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ›
                  </button>
                  <div style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "6px",
                  }}>
                    {imagenes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideActual(i)}
                        style={{
                          width: i === slideActual ? "20px" : "6px",
                          height: "6px",
                          backgroundColor: i === slideActual ? "#fff" : "rgba(255,255,255,0.5)",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          transition: "width 0.2s ease, background-color 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <p style={{
                fontSize: "10px",
                fontFamily: "'Jost', sans-serif",
                color: "var(--color-texto-sutil)",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}>
                {slideActual + 1} / {imagenes.length}{imagenes.length > 1 ? ` — cambia cada ${intervalo} segundos` : ""}
              </p>
              <p style={{
                fontSize: "10px",
                fontFamily: "'Jost', sans-serif",
                color: "var(--color-texto-sutil)",
                letterSpacing: "0.05em",
              }}>
                Arrastrá la imagen para ajustar la posición
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
