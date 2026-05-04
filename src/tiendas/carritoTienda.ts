import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { EstadoCarrito, ItemCarritoUI } from "@/tipos"

export const usarCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      items: [],
      agregarItem: (producto: ItemCarritoUI) => {
        set((estado) => {
          const existente = estado.items.find((i) => i.productoId === producto.productoId)
          if (existente) {
            return {
              items: estado.items.map((i) =>
                i.productoId === producto.productoId
                  ? { ...i, cantidad: i.cantidad + producto.cantidad }
                  : i
              ),
            }
          }
          return { items: [...estado.items, producto] }
        })
      },
      quitarItem: (productoId: string) =>
        set((estado) => ({
          items: estado.items.filter((i) => i.productoId !== productoId),
        })),
      actualizarCantidad: (productoId: string, cantidad: number) => {
        if (cantidad <= 0) {
          get().quitarItem(productoId)
          return
        }
        set((estado) => ({
          items: estado.items.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i
          ),
        }))
      },
      vaciarCarrito: () => set({ items: [] }),
      totalItems: () => get().items.reduce((t, i) => t + i.cantidad, 0),
      totalPrecio: () => get().items.reduce((t, i) => t + i.precio * i.cantidad, 0),
    }),
    {
      name: "decorarte-carrito",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
