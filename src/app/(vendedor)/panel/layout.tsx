import { redirect } from "next/navigation"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import SidebarPanel from "@/components/layout/SidebarPanel"

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "var(--color-superficie)",
    }}>
      <SidebarPanel />
      <main style={{
        flex: 1,
        padding: "32px",
        backgroundColor: "var(--color-superficie)",
      }}>
        {children}
      </main>
    </div>
  )
}
