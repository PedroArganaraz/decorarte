import { redirect } from "next/navigation"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import LayoutPanel from "@/components/layout/LayoutPanel"

export default async function LayoutHero({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  return <LayoutPanel>{children}</LayoutPanel>
}
