"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Prisma } from "@prisma/client"
type ImagenProducto = Prisma.ImagenProductoGetPayload<{}>

interface Props {
  productoId: string
  imagenesActuales: ImagenProducto[]
}

export default function SubidorImagenes({ productoId, imagenesActuales }: Props) {
  const [imagenes, setImagenes] = useState<ImagenProducto[]>(imagenesActuales)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
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
      method: "POST",
      body: (() => {
        const fd = new FormData()
        fd.append("imagenId", imagenId)
        fd.append("accion", "marcarPrincipal")
        return fd
      })(),
    })

    if (res.ok) {
      setImagenes((prev) =>
        prev.map((img) => ({ ...img, esPrincipal: img.id === imagenId }))
      )
      toast.success("Imagen principal actualizada")
      router.refresh()
    }
  }

  const manejarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    manejarArchivos(e.dataTransfer.files)
  }

  return (
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
              style={{
                position: "relative",
                border: img.esPrincipal
                  ? "2px solid var(--color-texto)"
                  : "0.5px solid var(--color-borde)",
              }}
            >
              <img
                src={img.urlPublica}
                alt={img.altText || ""}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
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
                borderTop: "0.5px solid var(--color-borde)",
              }}>
                {!img.esPrincipal && (
                  <button
                    onClick={() => marcarPrincipal(img.id)}
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
                    Principal
                  </button>
                )}
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
