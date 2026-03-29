import { NextResponse } from "next/server"
import {
  generateUniqueGroupOrderCode,
  getEffectiveProductPrice,
  groupOrdersAdmin,
  requireRequestUser,
} from "@/lib/group-orders-server"

export async function POST(request: Request) {
  if (!groupOrdersAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const user = await requireRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "لازم تسجل دخول الأول علشان تنشئ طلب جماعي" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const seedItems = Array.isArray(body?.seedItems) ? body.seedItems : []
  const code = await generateUniqueGroupOrderCode()
  const participantKey = crypto.randomUUID()

  const { data: profile } = await groupOrdersAdmin
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle()

  const displayName =
    String(profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email || "صاحب الطلب")
      .trim() || "صاحب الطلب"

  const { data: groupOrder, error: groupOrderError } = await groupOrdersAdmin
    .from("group_orders")
    .insert({
      code,
      host_user_id: user.id,
      status: "open",
    })
    .select("id")
    .single()

  if (groupOrderError || !groupOrder) {
    return NextResponse.json({ error: groupOrderError?.message || "فشل إنشاء الطلب الجماعي" }, { status: 500 })
  }

  const { data: participant, error: participantError } = await groupOrdersAdmin
    .from("group_order_participants")
    .insert({
      group_order_id: groupOrder.id,
      user_id: user.id,
      display_name: displayName,
      is_host: true,
      access_key: participantKey,
    })
    .select("id")
    .single()

  if (participantError || !participant) {
    await groupOrdersAdmin.from("group_orders").delete().eq("id", groupOrder.id)
    return NextResponse.json({ error: participantError?.message || "فشل تجهيز صاحب الطلب" }, { status: 500 })
  }

  if (seedItems.length > 0) {
    const normalizedSeedItems: Array<{ productId: string; quantity: number }> = seedItems
      .map((item: any) => ({
        productId: String(item?.productId || "").trim(),
        quantity: Math.max(1, Number(item?.quantity || 1)),
      }))
      .filter((item: { productId: string; quantity: number }) => item.productId)

    const productIds = Array.from(new Set(normalizedSeedItems.map((item: { productId: string; quantity: number }) => item.productId)))
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await groupOrdersAdmin
        .from("products")
        .select("id, price, discount_percentage")
        .in("id", productIds)

      if (!productsError && products) {
        const productMap = new Map(products.map((product: any) => [product.id, product]))
        const itemsToInsert = normalizedSeedItems
          .map((item) => {
            const product = productMap.get(item.productId)
            if (!product) return null
            return {
              group_order_id: groupOrder.id,
              participant_id: participant.id,
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: getEffectiveProductPrice(product),
            }
          })
          .filter(Boolean)

        if (itemsToInsert.length > 0) {
          await groupOrdersAdmin.from("group_order_items").insert(itemsToInsert)
        }
      }
    }
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || ""

  return NextResponse.json({
    code,
    participantKey,
    displayName,
    shareUrl: `${origin}/group-order/${code}`,
  })
}
