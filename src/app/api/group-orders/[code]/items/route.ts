import { NextResponse } from "next/server"
import {
  fetchGroupOrderGraphByCode,
  getEffectiveProductPrice,
  getOptionalRequestUser,
  groupOrdersAdmin,
} from "@/lib/group-orders-server"

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  if (!groupOrdersAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const { code } = await context.params
  const body = await request.json().catch(() => ({}))
  const participantKey = String(body?.participantKey || "").trim()
  const productId = String(body?.productId || "").trim()
  const quantity = Math.max(1, Number(body?.quantity || 1))

  if (!participantKey || !productId) {
    return NextResponse.json({ error: "بيانات الإضافة ناقصة" }, { status: 400 })
  }

  const graph = await fetchGroupOrderGraphByCode(code)
  if (!graph) {
    return NextResponse.json({ error: "الطلب الجماعي ده مش موجود" }, { status: 404 })
  }

  if (graph.groupOrder.status !== "open") {
    return NextResponse.json({ error: "الطلب الجماعي اتأكد بالفعل ومش بيقبل إضافات جديدة" }, { status: 400 })
  }

  const user = await getOptionalRequestUser(request)
  const participant =
    graph.participants.find((entry) => entry.access_key === participantKey) ||
    (user?.id === graph.groupOrder.host_user_id
      ? graph.participants.find((entry) => entry.is_host)
      : null)

  if (!participant) {
    return NextResponse.json({ error: "ادخل الطلب الجماعي باسمك الأول قبل ما تضيف منتجات" }, { status: 401 })
  }

  const { data: product, error: productError } = await groupOrdersAdmin
    .from("products")
    .select("id, price, discount_percentage, name")
    .eq("id", productId)
    .maybeSingle()

  if (productError || !product) {
    return NextResponse.json({ error: "المنتج ده غير متاح دلوقتي" }, { status: 404 })
  }

  const { data: existingItem } = await groupOrdersAdmin
    .from("group_order_items")
    .select("id, quantity")
    .eq("group_order_id", graph.groupOrder.id)
    .eq("participant_id", participant.id)
    .eq("product_id", productId)
    .is("selected_variant_json", null)
    .maybeSingle()

  if (existingItem) {
    const { error } = await groupOrdersAdmin
      .from("group_order_items")
      .update({
        quantity: Number(existingItem.quantity || 0) + quantity,
        unit_price: getEffectiveProductPrice(product),
      })
      .eq("id", existingItem.id)

    if (error) {
      return NextResponse.json({ error: error.message || "مقدرتش أضيف المنتج دلوقتي" }, { status: 500 })
    }
  } else {
    const { error } = await groupOrdersAdmin
      .from("group_order_items")
      .insert({
        group_order_id: graph.groupOrder.id,
        participant_id: participant.id,
        product_id: productId,
        quantity,
        unit_price: getEffectiveProductPrice(product),
        selected_variant_json: null,
      })

    if (error) {
      return NextResponse.json({ error: error.message || "مقدرتش أضيف المنتج دلوقتي" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
