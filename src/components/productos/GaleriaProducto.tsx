"use client"

import { useState } from "react"
import type { ImagenProducto } from "@prisma/client"

interface Props {
  imagenes: ImagenProducto[]
}

export default function GaleriaProducto({ imagenes }: Props) {
  const imagenPrincipal = imagenes.find((img) => img.esPrincipal) ?? imagenes[0]
  const [seleccionada, setSeleccionada] = useState(imagenPrincipal)

  if (!imagenes.length) {
    return (
      <div style={{
        aspectRatio: "1",
        backgroundColor: "var(--color-superficie)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        letterSpacing: "0.1em",
        color: "var(--color-texto-sutil)",
      }}>
        Sin imágenes
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{
        position: "relative",
        aspectRatio: "1",
        backgroundColor: "var(--color-superficie)",
        overflow: "hidden",
        border: "0.5px solid var(--color-borde)",
      }}>
        <img
          src={seleccionada?.urlPublica ?? ""}
          alt={seleccionada?.altText || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.2s ease",
          }}
        />
      </div>

      {imagenes.length > 1 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}>
          {imagenes.map((img) => (
            <button
              key={img.id}
              onClick={() => setSeleccionada(img)}
              style={{
                padding: 0,
                border: seleccionada?.id === img.id
                  ? "2px solid var(--color-texto)"
                  : "0.5px solid var(--color-borde)",
                cursor: "pointer",
                backgroundColor: "transparent",
                aspectRatio: "1",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                src={img.urlPublica}
                alt={img.altText || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: seleccionada?.id === img.id ? 1 : 0.6,
                  transition: "opacity 0.2s ease",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
