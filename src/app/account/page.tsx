import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AccountPageClient from "./account-page-client"

export default async function AccountPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value

  if (!accessToken) {
    redirect("/login?redirect=/account")
  }

  return <AccountPageClient />
}
