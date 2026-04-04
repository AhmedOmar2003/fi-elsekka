import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import LoginPageClient from "./login-page-client"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = await searchParams
  const redirectTo = typeof params.redirect === "string" ? params.redirect : ""

  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center p-4">
        <LoginPageClient redirectTo={redirectTo} />
      </main>
      <Footer />
    </>
  )
}
