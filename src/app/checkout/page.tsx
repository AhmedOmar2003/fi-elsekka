import CheckoutPageClient from "./checkout-page-client"

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    buyNow?: string
    qty?: string
    price?: string
    variant?: string
    requestMode?: string
    categoryId?: string
    groupOrder?: string
  }>
}) {
  const params = await searchParams

  return (
    <CheckoutPageClient
      initialParams={{
        buyNow: typeof params.buyNow === "string" ? params.buyNow : null,
        qty: typeof params.qty === "string" ? params.qty : null,
        price: typeof params.price === "string" ? params.price : null,
        variant: typeof params.variant === "string" ? params.variant : null,
        requestMode: typeof params.requestMode === "string" ? params.requestMode : null,
        categoryId: typeof params.categoryId === "string" ? params.categoryId : null,
        groupOrder: typeof params.groupOrder === "string" ? params.groupOrder : null,
      }}
    />
  )
}
