"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { fetchProductDetails, Product } from "@/services/productsService"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { CheckCircle2, MapPin, CreditCard, User, AlertCircle, Search, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { createOrder } from "@/services/ordersService"
import { getDefaultDeliveryAddress, saveDeliveryAddress } from "@/services/deliveryService"
import {
   applyDiscount,
   clearAppliedDiscountCodesForProducts,
   getAppliedCartDiscountCode,
   clearLegacyAppliedDiscountCode,
   getAppliedDiscountCodesForProducts,
   incrementDiscountCodeUsage,
   removeAppliedCartDiscountCode,
   validateDiscountCode,
} from "@/services/discountCodesService"
import { CURRENT_DELIVERY_FEE } from "@/lib/order-economics"
import {
   clearTextCategoryOrderDraft,
   getTextRequestCategoryConfig,
   readTextCategoryOrderDraft,
   TEXT_CATEGORY_ORDER_MODE,
   type TextCategoryOrderDraft,
} from "@/lib/text-category-orders"
import { RequestAttachmentsGallery } from "@/components/orders/request-attachments-gallery"
import { getBundleItemCount, getBundleItems } from "@/lib/product-presentation"
import { fetchGroupOrder, finalizeGroupOrder, type GroupOrderView } from "@/services/groupOrdersService"
import { clearStoredGroupParticipant, getStoredGroupParticipant } from "@/lib/group-order-session"
import { getSelectedVariantLabel, normalizeSelectedVariant, resolveVariantUnitPrice, type SelectedVariantJson } from "@/lib/product-variants"

type CheckoutInitialParams = {
   buyNow: string | null
   qty: string | null
   price: string | null
   variant: string | null
   requestMode: string | null
   categoryId: string | null
   groupOrder: string | null
}

export default function CheckoutPageClient({
   initialParams,
}: {
   initialParams: CheckoutInitialParams
}) {
   const router = useRouter()
   
   const buyNowId = initialParams.buyNow
   const buyNowQtyRaw = initialParams.qty
   const buyNowPriceRaw = initialParams.price
   const buyNowVariantRaw = initialParams.variant
   const requestMode = initialParams.requestMode
   const textCategoryId = initialParams.categoryId
   const groupOrderCode = initialParams.groupOrder

   const [overrideProduct, setOverrideProduct] = React.useState<Product | null>(null)
   const [isOverrideLoading, setIsOverrideLoading] = React.useState(!!buyNowId)
   const [textRequestDraft, setTextRequestDraft] = React.useState<TextCategoryOrderDraft | null>(null)
   const [isTextRequestLoading, setIsTextRequestLoading] = React.useState(requestMode === TEXT_CATEGORY_ORDER_MODE)
   const [groupOrder, setGroupOrder] = React.useState<GroupOrderView | null>(null)
   const [isGroupOrderLoading, setIsGroupOrderLoading] = React.useState(!!groupOrderCode)
   const buyNowSelectedVariant = React.useMemo<SelectedVariantJson>(() => {
      if (!buyNowVariantRaw) return null
      try {
         return normalizeSelectedVariant(JSON.parse(buyNowVariantRaw))
      } catch {
         return null
      }
   }, [buyNowVariantRaw])

   React.useEffect(() => {
      if (buyNowId) {
         fetchProductDetails(buyNowId).then(p => {
            setOverrideProduct(p)
            setIsOverrideLoading(false)
         })
      }
   }, [buyNowId])

   React.useEffect(() => {
      if (requestMode !== TEXT_CATEGORY_ORDER_MODE || !textCategoryId) {
         setIsTextRequestLoading(false)
         return
      }

      const draft = readTextCategoryOrderDraft(textCategoryId)
      setTextRequestDraft(draft)
      setIsTextRequestLoading(false)
   }, [requestMode, textCategoryId])

   React.useEffect(() => {
      if (!groupOrderCode) {
         setGroupOrder(null)
         setIsGroupOrderLoading(false)
         return
      }

      let isActive = true
      setIsGroupOrderLoading(true)

      fetchGroupOrder(groupOrderCode, getStoredGroupParticipant(groupOrderCode)?.participantKey)
         .then((data) => {
            if (isActive) {
               setGroupOrder(data)
            }
         })
         .catch((error) => {
            if (isActive) {
               setErrorMsg(error instanceof Error ? error.message : "مقدرناش نجهز الطلب الجماعي دلوقتي.")
            }
         })
         .finally(() => {
            if (isActive) {
               setIsGroupOrderLoading(false)
            }
         })

      return () => {
         isActive = false
      }
   }, [groupOrderCode])

   const { user, profile, isLoading: isAuthLoading } = useAuth()
   const cart = useCart()
   
   const isUsingOverride = !!(buyNowId && overrideProduct)
   const isTextRequestCheckout = requestMode === TEXT_CATEGORY_ORDER_MODE
   const isGroupOrderCheckout = !!groupOrderCode
   const textRequestCategoryConfig = React.useMemo(
      () => getTextRequestCategoryConfig(textRequestDraft?.categoryName),
      [textRequestDraft?.categoryName]
   )
   const isPharmacyTextRequestCheckout = isTextRequestCheckout && textRequestDraft?.categoryName === 'صيدلية'
   const isSearchRequestCheckout = isTextRequestCheckout && !isPharmacyTextRequestCheckout
   const textRequestHasText = !!textRequestDraft?.requestText?.trim()
   const textRequestHasImages = (textRequestDraft?.imageUrls?.length || 0) > 0
   const canSubmitTextRequest = React.useMemo(() => {
      if (!isTextRequestCheckout) return true
      if (!textRequestCategoryConfig) return textRequestHasText
      return textRequestCategoryConfig.requireText
         ? (textRequestDraft?.requestText || '').trim().length >= 12
         : (textRequestHasText || textRequestHasImages)
   }, [isTextRequestCheckout, textRequestCategoryConfig, textRequestDraft?.requestText, textRequestHasImages, textRequestHasText])

   const groupOrderDisplayItems = React.useMemo(() => {
      if (!groupOrder) return []
      return groupOrder.itemGroups.flatMap((group) =>
         group.items.map((item) => ({
            id: item.id,
            product_id: item.productId,
            quantity: item.quantity,
            applied_price: item.unitPrice,
            selected_variant_json: item.selectedVariantJson || null,
            participantName: group.displayName,
            product: item.product
               ? {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  image_url: item.product.image_url || undefined,
                  discount_percentage: item.product.discount_percentage || undefined,
                  specifications: item.product.specifications || undefined,
               }
               : undefined,
         }))
      )
   }, [groupOrder])

   const [isSubmitting, setIsSubmitting] = React.useState(false)
   const [errorMsg, setErrorMsg] = React.useState("")
   const [showSearchConfirmPopup, setShowSearchConfirmPopup] = React.useState(false)
   const [appliedCartCode, setAppliedCartCode] = React.useState<string | null>(null)
   const [cartCodeSavedAmount, setCartCodeSavedAmount] = React.useState(0)
   const [cartCodeLabel, setCartCodeLabel] = React.useState<string | null>(null)

   const displayItems = isGroupOrderCheckout ? groupOrderDisplayItems : isUsingOverride ? [{
      id: "override-item",
      product_id: overrideProduct.id,
      quantity: parseInt(buyNowQtyRaw || "1", 10),
      applied_price: buyNowPriceRaw ? parseFloat(buyNowPriceRaw) : null,
      selected_variant_json: buyNowSelectedVariant,
      product: overrideProduct
   }] : isTextRequestCheckout ? [] : cart.items;

   let displayCartTotal = cart.cartTotal;
   let displayCartOriginal = cart.cartOriginalTotal;
   let displayDiscount = cart.cartDiscountTotal;

   if (isGroupOrderCheckout && groupOrder) {
      displayCartTotal = groupOrder.totalAmount;
      displayCartOriginal = groupOrder.itemGroups.reduce(
         (sum, group) =>
            sum + group.items.reduce((groupSum, item) => groupSum + (resolveVariantUnitPrice(item.product || { price: item.unitPrice }, item.selectedVariantJson) * item.quantity), 0),
         0
      );
      displayDiscount = Math.max(0, displayCartOriginal - displayCartTotal);
   } else if (isUsingOverride && overrideProduct) {
      const qty = parseInt(buyNowQtyRaw || "1", 10)
      displayCartOriginal = resolveVariantUnitPrice(overrideProduct, buyNowSelectedVariant) * qty;
      
      let naturalPrice = overrideProduct.price;
      if (overrideProduct.discount_percentage && overrideProduct.discount_percentage > 0) {
         naturalPrice = Math.round(overrideProduct.price * (1 - overrideProduct.discount_percentage / 100));
      }
      
      const finalPrice = buyNowPriceRaw ? parseFloat(buyNowPriceRaw) : naturalPrice;
      displayCartTotal = finalPrice * qty;
      displayDiscount = displayCartOriginal - displayCartTotal;
   }

   React.useEffect(() => {
      if (isGroupOrderCheckout || isTextRequestCheckout || isUsingOverride) {
         setAppliedCartCode(null)
         setCartCodeSavedAmount(0)
         setCartCodeLabel(null)
         return
      }

      const savedCode = getAppliedCartDiscountCode()
      if (!savedCode || !user || displayCartTotal <= 0) {
         setAppliedCartCode(null)
         setCartCodeSavedAmount(0)
         setCartCodeLabel(null)
         return
      }

      let isActive = true

      validateDiscountCode(savedCode, { userId: user.id })
         .then(({ discount }) => {
            if (!isActive || !discount) {
               removeAppliedCartDiscountCode()
               setAppliedCartCode(null)
               setCartCodeSavedAmount(0)
               setCartCodeLabel(null)
               return
            }

            const result = applyDiscount(displayCartTotal, discount)
            setAppliedCartCode(savedCode)
            setCartCodeSavedAmount(result.savedAmount)
            setCartCodeLabel(result.label)
         })
         .catch(() => {
            if (!isActive) return
            removeAppliedCartDiscountCode()
            setAppliedCartCode(null)
            setCartCodeSavedAmount(0)
            setCartCodeLabel(null)
         })

      return () => {
         isActive = false
      }
   }, [displayCartTotal, isGroupOrderCheckout, isTextRequestCheckout, isUsingOverride, user])

   const finalDisplayCartTotal = Math.max(0, displayCartTotal - cartCodeSavedAmount)

   const isCartLoading = (isTextRequestCheckout || isGroupOrderCheckout ? false : cart.isLoading) || isOverrideLoading || isTextRequestLoading || isGroupOrderLoading

   // Form states
   const [firstName, setFirstName] = React.useState("")
   const [lastName, setLastName] = React.useState("")
   const [phone, setPhone] = React.useState("")
   const [city, setCity] = React.useState("ميت العامل")
   const [area, setArea] = React.useState("")
   const [address, setAddress] = React.useState("")
   const [notes, setNotes] = React.useState("")

   // Pre-fill from user's default saved delivery address (delivery_info table)
   React.useEffect(() => {
      if (!user) return;
      getDefaultDeliveryAddress(user.id).then(addr => {
         if (addr) {
            if (addr.recipient_name) {
               const parts = addr.recipient_name.split(" ")
               setFirstName(parts[0] || "")
               setLastName(parts.slice(1).join(" ") || "")
            } else if (profile?.full_name) {
               const parts = (profile.full_name).split(" ")
               setFirstName(parts[0] || "")
               setLastName(parts.slice(1).join(" ") || "")
            }
            if (addr.phone_number) setPhone(addr.phone_number)
            if (addr.city) setCity(addr.city)
            if (addr.area) setArea(addr.area)
            if (addr.address) setAddress(addr.address)
         } else if (profile?.full_name) {
            // Fallback: fill name from profile if no delivery address yet
            const parts = (profile.full_name).split(" ")
            setFirstName(parts[0] || "")
            setLastName(parts.slice(1).join(" ") || "")
         }
      })
   }, [user, profile])

   const submitOrder = async () => {
      if (!user) return
      if (!isTextRequestCheckout && displayItems.length === 0) return
      if (isGroupOrderCheckout && !groupOrder) {
         setErrorMsg("مقدرناش نجهز الطلب الجماعي دلوقتي، جرّب تفتح الرابط مرة تانية.")
         return
      }
      const activeGroupOrder = groupOrder
      if (isGroupOrderCheckout && !activeGroupOrder?.viewer.isHost) {
         setErrorMsg("صاحب الطلب فقط هو اللي يقدر يؤكد الطلب الجماعي.")
         return
      }
      if (isGroupOrderCheckout && activeGroupOrder?.groupOrder.status !== "open") {
         setErrorMsg("الطلب الجماعي ده متأكد بالفعل ومبقاش متاح للتعديل.")
         return
      }
      if (isTextRequestCheckout && !canSubmitTextRequest) {
         setErrorMsg("كمّل طلبك الأول بالنص أو الصور وبعدين ابعته.")
         return
      }
      setIsSubmitting(true)
      setErrorMsg("")

      const shippingDetails = {
         recipient: `${firstName} ${lastName}`,
         phone, city, area, street: address, notes,
         ...(appliedCartCode ? {
            cart_discount_code: appliedCartCode,
            cart_discount_saved_amount: cartCodeSavedAmount,
            cart_discount_label: cartCodeLabel,
         } : {}),
         is_grace_period: !isTextRequestCheckout && !isGroupOrderCheckout,
         ...(isGroupOrderCheckout ? {
            group_order: true,
            group_order_code: activeGroupOrder?.groupOrder.code,
            group_order_participants: activeGroupOrder?.participants.map((participant) => ({
               id: participant.id,
               display_name: participant.displayName,
               is_host: participant.isHost,
            })) || [],
            group_order_items_count: activeGroupOrder?.totalItems || 0,
         } : {}),
         ...(isTextRequestCheckout ? {
            request_mode: 'custom_category_text',
            custom_request_text: textRequestDraft?.requestText?.trim(),
            custom_request_category_id: textRequestDraft?.categoryId,
            custom_request_category_name: textRequestDraft?.categoryName,
            custom_request_image_urls: textRequestDraft?.imageUrls || [],
            custom_request_attachment_count: textRequestDraft?.imageUrls?.length || 0,
            custom_request_has_attachments: (textRequestDraft?.imageUrls?.length || 0) > 0,
            pricing_pending: true,
            quoted_delivery_fee: CURRENT_DELIVERY_FEE,
         } : {}),
      }

      const { data: newOrder, error } = await createOrder(user.id, displayItems, shippingDetails, finalDisplayCartTotal, {
         clearCartAfterOrder: !isUsingOverride && !isTextRequestCheckout && !isGroupOrderCheckout,
      })
      setIsSubmitting(false)

      if (error) {
         setErrorMsg((error as any).message || (isTextRequestCheckout ? "في حاجة عطلتنا وإحنا بنبعت طلبك، جرّب تاني." : "في حاجة عطلت التأكيد، جرّب مرة كمان."))
         return
      }

      if (isTextRequestCheckout && textCategoryId) {
         clearTextCategoryOrderDraft(textCategoryId)
      }

      if (isGroupOrderCheckout && groupOrderCode && newOrder?.id) {
         try {
            await finalizeGroupOrder(groupOrderCode, newOrder.id)
            clearStoredGroupParticipant(groupOrderCode)
         } catch (groupOrderError) {
            console.error('Failed to finalize group order:', groupOrderError)
         }
      }

      // Save or update their delivery address for next time
      await saveDeliveryAddress(user.id, {
         label: 'المنزل',
         recipient_name: `${firstName} ${lastName}`,
         phone_number: phone,
         city, area, address,
         is_default: true
      })

      // Increment usage count for the product-specific discount codes that were actually used
      const orderedProductIds = Array.from(
         new Set(displayItems.map((item) => item.product_id).filter((productId): productId is string => !!productId))
      )
      if (!isGroupOrderCheckout) {
         const appliedCodes = getAppliedDiscountCodesForProducts(orderedProductIds)
         const allAppliedCodes = appliedCartCode ? Array.from(new Set([...appliedCodes, appliedCartCode])) : appliedCodes
         if (allAppliedCodes.length > 0 && user) {
            await Promise.all(allAppliedCodes.map((appliedCode) => incrementDiscountCodeUsage(appliedCode, user.id)))
            clearAppliedDiscountCodesForProducts(orderedProductIds)
            removeAppliedCartDiscountCode()
          } else {
             clearLegacyAppliedDiscountCode()
             removeAppliedCartDiscountCode()
          }
      }

      if (isSearchRequestCheckout) {
         router.push(`/account?tab=search_requests&searchRequestCreated=1`)
         return
      }

      router.push(`/order-success?orderId=${newOrder?.id || ''}${isTextRequestCheckout ? '&awaitingQuote=1' : ''}`)
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSearchRequestCheckout) {
         if (!canSubmitTextRequest) {
            setErrorMsg("اكتب طلبك بشكل أوضح شوية قبل ما نبعت ندور عليه.")
            return
         }
         setShowSearchConfirmPopup(true)
         return
      }
      await submitOrder()
   }

   const isLoading = isAuthLoading || isCartLoading

   if (isLoading) {
      return (
         <>
            <Header />
            <main className="flex-1 pb-24 md:pb-8 bg-background flex items-center justify-center min-h-[60vh]">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </main>
            <Footer />
         </>
      )
   }

   if (!user) {
      return (
         <>
            <Header />
            <main className="flex-1 pb-24 md:pb-8 flex flex-col items-center justify-center min-h-[60vh] bg-background px-4 text-center">
               <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-surface-hover shadow-lg">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
               </div>
               <h2 className="text-2xl font-black text-foreground mb-3">لازم تدخل الأول 👋</h2>
               <p className="text-gray-400 max-w-sm mb-8">علشان تكمّل طلبك وتحفظ عناوينك، ادخل بحسابك الأول.</p>
               <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="rounded-xl px-10 font-bold text-lg shadow-primary/20 shadow-lg" asChild>
                     <Link href={`/login?redirect=${encodeURIComponent(groupOrderCode ? `/checkout?groupOrder=${groupOrderCode}` : '/checkout')}`}>تسجيل الدخول</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl px-10 font-bold text-lg" asChild>
                     <Link href={`/register?redirect=${encodeURIComponent(groupOrderCode ? `/checkout?groupOrder=${groupOrderCode}` : '/checkout')}`}>إنشاء حساب</Link>
                  </Button>
               </div>
            </main>
            <Footer />
         </>
      )
   }

   return (
      <>
         <Header />
         <main className="flex-1 pb-32 md:pb-8 min-h-screen bg-background">
            {showSearchConfirmPopup && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-surface p-6 shadow-premium">
                     <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Search className="h-7 w-7" />
                     </div>
                     <h2 className="text-center text-2xl font-black text-foreground">إحنا هندورلك عليه 👀</h2>
                     <p className="mt-3 text-center text-sm leading-7 text-gray-500">
                        استنى علينا شوية وإحنا هندورلك على طلبك. ولو لقيناه هنبعتلك إشعار ونقولك سعره كام، وتتابعه من صفحة حسابك في قسم
                        <span className="font-black text-foreground"> حاجات بندور عليها</span>.
                     </p>
                     <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-right">
                        <p className="text-xs font-black text-amber-500">مهم</p>
                        <p className="mt-2 text-sm leading-7 text-gray-500">
                           طول ما إحنا لسه بندور على الطلب، تقدر تلغيه من حسابك في أي وقت. إنما لو لقيناه ورجعنالك بالسعر، ساعتها القرار هيبقى عندك نكمّل ولا لأ.
                        </p>
                     </div>
                     <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <button
                           type="button"
                           onClick={async () => {
                              setShowSearchConfirmPopup(false)
                              await submitOrder()
                           }}
                           disabled={isSubmitting}
                           className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                        >
                           <CheckCircle2 className="h-4 w-4" />
                           خلاص تمام في انتظاركم
                        </button>
                        <button
                           type="button"
                           onClick={() => setShowSearchConfirmPopup(false)}
                           disabled={isSubmitting}
                           className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-60"
                        >
                           <XCircle className="h-4 w-4" />
                           لا خلاص مش عاوزكم تدوروا
                        </button>
                     </div>
                  </div>
               </div>
            )}

            <div className="bg-surface border-b border-surface-hover py-4 md:py-6">
               <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                  <h1 className="text-xl md:text-2xl font-black text-foreground">كمّل طلبك</h1>
                  {isGroupOrderCheckout && groupOrder && (
                     <p className="mt-2 text-sm font-bold text-primary">
                        أنت بتأكد الآن طلبًا جماعيًا شارك فيه {groupOrder.participants.length} أشخاص.
                     </p>
                  )}
                  {isGroupOrderCheckout && groupOrder && !groupOrder.viewer.isHost && (
                     <p className="mt-2 text-sm font-bold text-amber-500">
                        أنت مشارك فقط، وصاحب الطلب هو الوحيد اللي يقدر يكمل التأكيد النهائي.
                     </p>
                  )}
               </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
               <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                  {/* Checkout Form */}
                  <div className="lg:col-span-7 space-y-8">

                     {/* Contact Details */}
                     <div className="bg-surface-container-low/40 border border-surface-border/50 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                        <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-border/40 pb-4">
                           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <User className="w-5 h-5" />
                           </span>
                           بياناتك
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-2">
                              <Label htmlFor="firstName">الاسم الأول</Label>
                              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="مثال: أحمد" />
                           </div>
                           <div className="space-y-2">
                              <Label htmlFor="lastName">الاسم الأخير</Label>
                              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="مثال: محمد" />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="phone">رقم موبايلك</Label>
                              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
                              <p className="text-xs text-gray-400">ده الرقم اللي هنتواصل معاك عليه بخصوص الطلب</p>
                           </div>
                        </div>
                     </div>

                     {/* Delivery Details */}
                     <div className="bg-surface-container-low/40 border border-surface-border/50 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                        <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-border/40 pb-4">
                           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <MapPin className="w-5 h-5" />
                           </span>
                           عنوان التوصيل
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-2">
                              <Label htmlFor="city">منطقة التوصيل</Label>
                              <Input
                                 id="city"
                                 value="ميت العامل"
                                 readOnly
                                 className="cursor-not-allowed opacity-80"
                              />
                              <p className="text-xs text-gray-400">التوصيل متاح حاليًا داخل ميت العامل فقط.</p>
                           </div>
                            <div className="space-y-2">
                              <Label htmlFor="area">اسم المنطقة</Label>
                              <Input id="area" value={area} onChange={e => setArea(e.target.value)} required placeholder="مثال: بوابة العرب" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="address">عنوان الشارع بالتفصيل</Label>
                              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="مثال: بوابة العرب بجوار صيدلية ميسرة" />
                            </div>
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="notes">علامة مميزة لو تحب</Label>
                              <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: جنب المسجد الكبير، قبل المدرسة، قدام السوبر ماركت..." />
                           </div>
                        </div>
                     </div>

                     {/* Payment Method */}
                     <div className="bg-surface-container-low/40 border border-surface-border/50 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                        <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-border/40 pb-4">
                           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                              <CreditCard className="w-5 h-5" />
                           </span>
                           هتدفع إزاي
                        </h2>

                        <label className="relative flex cursor-pointer rounded-2xl border-2 border-primary bg-primary/5 p-5 focus:outline-none shadow-sm transition-all hover:bg-primary/10">
                           <input type="radio" name="payment" value="cod" className="sr-only" defaultChecked />
                           <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-primary/20">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                 </span>
                                 <div className="text-sm">
                                    <p className="font-heading font-bold text-base text-foreground mb-1">الدفع عند الاستلام (كاش)</p>
                                    <p className="text-gray-400">ادفع براحتك لما المندوب يوصلك وتطمن على طلبك.</p>
                                 </div>
                              </div>
                           </div>
                        </label>
                     </div>

                  </div>

                  {/* Order Summary Sidebar */}
                  <div className="lg:col-span-5">
                     <div className="rounded-[2rem] bg-surface-container-low/80 backdrop-blur-xl border border-surface-border/60 p-6 sm:p-8 sticky top-24 shadow-premium">
                        <h3 className="text-xl font-heading font-bold mb-6 text-foreground border-b border-surface-border/40 pb-4">ملخص طلبك</h3>

                        <div className="divide-y divide-surface-hover border-b border-surface-hover mb-6 pb-6 max-h-48 overflow-y-auto custom-scrollbar">
                           {isTextRequestCheckout && textRequestDraft ? (
                              <div className="space-y-4 py-1">
                                 <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                    <p className="text-xs font-black text-primary/80">نوع الطلب</p>
                                    <p className="mt-1 text-base font-black text-foreground">{textRequestDraft.categoryName}</p>
                                 </div>
                                 <div className="rounded-2xl border border-surface-hover bg-background/60 p-4">
                                    <p className="text-xs font-black text-gray-500">النص اللي هيشوفه الأدمن والمندوب</p>
                                    <p className="mt-2 text-sm leading-7 text-foreground whitespace-pre-wrap">
                                       {textRequestDraft.requestText?.trim() || 'لم يكتب العميل نصًا، وسيعتمد الطلب على الصور المرفقة.'}
                                    </p>
                                 </div>
                                 {(textRequestDraft.imageUrls?.length || 0) > 0 && (
                                    <RequestAttachmentsGallery
                                       imageUrls={textRequestDraft.imageUrls || []}
                                       title="الصور التي ستصل إلى الأدمن والمندوب"
                                       hint="لو رفعت روشتة أو صور دواء، ستظهر هنا كما ستُرسل مع الطلب."
                                    />
                                 )}
                                 <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                                    <p className="text-xs font-black text-amber-500">{isPharmacyTextRequestCheckout ? 'التسعير' : 'البحث عن الطلب'}</p>
                                    <p className="mt-2 text-sm leading-7 text-gray-500">
                                       {isPharmacyTextRequestCheckout
                                          ? 'بعد إرسال طلب الصيدلية ستراجع الإدارة التفاصيل وترسل لك السعر الكامل شامل التوصيل، وبعدها فقط يظهر لك زر تأكيد الطلب الحقيقي.'
                                          : 'بعد ما تبعت طلب البحث، إحنا هندور على المنتج الأول. ولو لقيناه هنبعتلك إشعار بالسعر وتكمل من صفحة حسابك.'}
                                    </p>
                                 </div>
                              </div>
                           ) : displayItems.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">السلة فاضية</p>
                           ) : displayItems.map(item => (
                              <div key={item.id} className="flex justify-between py-3 text-sm">
                                 <div className="flex gap-3 items-start">
                                    <span className="font-heading font-black text-gray-500 w-5 pt-0.5">{item.quantity}x</span>
                                    <div>
                                       <span className="text-foreground line-clamp-1 font-medium">{item.product?.name || "منتج"}</span>
                                       {'participantName' in item && item.participantName ? (
                                          <p className="mt-1 text-[11px] font-black text-primary">إضافة: {item.participantName}</p>
                                       ) : null}
                                       {getSelectedVariantLabel((item as any).selected_variant_json) ? (
                                          <p className="mt-1 text-[11px] font-bold text-gray-400">
                                             {getSelectedVariantLabel((item as any).selected_variant_json)}
                                          </p>
                                       ) : null}
                                       {getBundleItemCount(item.product?.specifications) > 0 && (
                                          <div className="mt-1 space-y-1.5">
                                             <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                                                   باكج
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                   فيها {getBundleItemCount(item.product?.specifications)} منتجات
                                                </span>
                                             </div>
                                             <div className="flex flex-wrap gap-1.5">
                                                {getBundleItems(item.product?.specifications).slice(0, 4).map((bundleItem, index) => (
                                                   <span
                                                      key={`${bundleItem.name}-${index}`}
                                                      className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-gray-400 border border-surface-hover"
                                                   >
                                                      {bundleItem.quantity ? `${bundleItem.name} - ${bundleItem.quantity}` : bundleItem.name}
                                                   </span>
                                                ))}
                                                {getBundleItems(item.product?.specifications).length > 4 && (
                                                   <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                                      +{getBundleItems(item.product?.specifications).length - 4}
                                                   </span>
                                                )}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end shrink-0">
                                    <span className="font-heading font-bold text-foreground">
                                       {(() => {
                                          const p = item.product;
                                          const unitPrice = Number((item as any).applied_price ?? 0)
                                          if (unitPrice > 0) {
                                             return unitPrice * item.quantity;
                                          }
                                          if (!p) return 0;
                                          if (p.discount_percentage && p.discount_percentage > 0) {
                                             return Math.round(p.price * (1 - p.discount_percentage / 100)) * item.quantity;
                                          }
                                          return (p.price || 0) * item.quantity;
                                       })().toLocaleString()} ج.م
                                    </span>
                                    {item.product?.discount_percentage ? (
                                       <span className="text-[10px] text-rose-400 line-through">
                                          {((item.product.price || 0) * item.quantity).toLocaleString()}
                                       </span>
                                    ) : null}
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="space-y-4 mb-8 text-base font-medium">
                           {isTextRequestCheckout ? (
                              <>
                                 <div className="flex justify-between items-center text-gray-500">
                                    <span>{isPharmacyTextRequestCheckout ? 'قيمة المنتجات' : 'حالة الطلب'}</span>
                                    <span className="font-heading font-semibold text-foreground">{isPharmacyTextRequestCheckout ? 'ستراجعها الإدارة أولًا' : 'هنبدأ ندوّر عليه الأول'}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-surface-hover/50">
                                    <span>الخطوة التالية</span>
                                    <span className="font-heading font-semibold text-foreground">{isPharmacyTextRequestCheckout ? 'تصلك التسعيرة لتوافق أو ترفض' : 'يتسجل في حسابك كطلب بندور عليه'}</span>
                                 </div>
                              </>
                           ) : (
                              <>
                                 <div className="flex justify-between items-center text-gray-500">
                                    <span>المجموع الأصلي</span>
                                    <span className="font-heading font-semibold text-foreground">{displayCartOriginal.toLocaleString()} ج.م</span>
                                 </div>
                                 {displayDiscount > 0 && (
                                    <div className="flex justify-between items-center text-rose-400">
                                       <span>إجمالي الخصم</span>
                                       <span className="font-heading font-semibold text-rose-400">- {displayDiscount.toLocaleString()} ج.م</span>
                                    </div>
                                 )}
                                 {cartCodeSavedAmount > 0 && (
                                    <div className="flex justify-between items-center text-amber-300">
                                       <span>خصم الكوبون</span>
                                       <span className="font-heading font-semibold text-amber-300">- {cartCodeSavedAmount.toLocaleString()} ج.م</span>
                                    </div>
                                 )}
                                 <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-surface-hover/50">
                                    <span>المجموع بعد الخصم</span>
                                    <span className="font-heading font-semibold text-foreground">{finalDisplayCartTotal.toLocaleString()} ج.م</span>
                                  </div>
                              </>
                           )}
                           <div className="flex justify-between items-center text-gray-400">
                              <span>مصاريف التوصيل</span>
                              <span className="font-heading font-semibold text-foreground">{CURRENT_DELIVERY_FEE} ج.م</span>
                           </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-surface-hover pt-6 mb-8 bg-surface-lighter/50 rounded-xl p-4 mt-2">
                           <span className="text-lg font-bold text-foreground">{isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'السعر النهائي' : 'حالة الطلب') : 'الإجمالي للدفع'}</span>
                           <span className="font-heading text-3xl font-black text-primary drop-shadow-sm">
                              {isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'بانتظار التسعير' : 'بندور عليه') : `${(finalDisplayCartTotal + CURRENT_DELIVERY_FEE).toFixed(0)} `}
                              {!isTextRequestCheckout && <span className="text-sm">ج.م</span>}
                           </span>
                        </div>

                        {errorMsg && (
                           <p className="text-rose-500 text-sm text-center mb-4 bg-rose-500/10 p-3 rounded-xl">{errorMsg}</p>
                        )}

                        <div className="hidden md:block">
                           <Button
                              type="submit"
                              size="lg"
                              className="h-14 w-full rounded-xl text-lg font-bold"
                              disabled={isSubmitting || (!isTextRequestCheckout && displayItems.length === 0) || (isTextRequestCheckout && !canSubmitTextRequest) || (isGroupOrderCheckout && !groupOrder?.viewer.isHost)}
                           >
                              {isSubmitting ? (
                                 <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'بنبعت طلب التسعير...' : 'بنبعت طلب البحث...') : 'بنكمل التأكيد...'}
                                 </div>
                              ) : (isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'إرسال طلب التسعير' : 'ابعت طلب بحث') : (isGroupOrderCheckout ? 'تأكيد الطلب الجماعي' : 'تأكيد الطلب'))}
                           </Button>

                           <p className="mt-4 text-xs text-center text-gray-500">
                              {isTextRequestCheckout
                                 ? (isPharmacyTextRequestCheckout
                                    ? 'بمجرد ما تبعت طلب الصيدلية، هنراجعه ونبعتلك السعر وبعدها أنت اللي تقرر.'
                                    : 'بمجرد ما تبعت طلب البحث، هنبدأ ندور عليه ونبلغك من صفحة حسابك أول ما نلاقيه.')
                                 : (isGroupOrderCheckout
                                    ? 'بمجرد ما تؤكد الطلب الجماعي، هيتحول لطلب واحد ويتقفل الرابط على أي تعديل جديد.'
                                    : 'بمجرد ما تضغط تأكيد الطلب، إحنا هنبدأ نجهزهولك على طول.')}
                           </p>
                        </div>
                     </div>
                  </div>

               </form>
            </div>
         </main>

         <div className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-hover bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur md:hidden">
            <div className="mx-auto max-w-4xl">
               <div className="mb-3 flex items-center justify-between rounded-2xl border border-surface-hover bg-surface px-4 py-3">
                  <div>
                     <p className="text-[11px] font-bold text-gray-500">
                        {isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'السعر النهائي' : 'حالة الطلب') : 'الإجمالي للدفع'}
                     </p>
                     <p className="mt-1 text-lg font-black text-primary">
                        {isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'بانتظار التسعير' : 'بندور عليه') : `${(displayCartTotal + CURRENT_DELIVERY_FEE).toFixed(0)} ج.م`}
                     </p>
                  </div>
                  <p className="text-[11px] leading-5 text-gray-500 text-right max-w-[11rem]">
                     {isTextRequestCheckout
                        ? (isPharmacyTextRequestCheckout
                           ? 'هنراجع الطلب الأول، ولما السعر يوصل هتلاقي زر التأكيد جوه طلباتك.'
                           : 'طلبك هيتسجل في حسابك تحت حاجات بندور عليها لحد ما نلاقيه.')
                        : 'رسوم التوصيل مضافة بالفعل داخل الإجمالي.'}
                  </p>
               </div>

                <Button
                   form="checkout-form"
                   type="submit"
                   size="lg"
                   className="h-14 w-full rounded-2xl text-base font-black shadow-primary/20 shadow-lg"
                   disabled={isSubmitting || (!isTextRequestCheckout && displayItems.length === 0) || (isTextRequestCheckout && !canSubmitTextRequest) || (isGroupOrderCheckout && !groupOrder?.viewer.isHost)}
                >
                   {isSubmitting ? (
                      <div className="flex items-center gap-2">
                         <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                         {isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'بنبعت طلب التسعير...' : 'بنبعت طلب البحث...') : 'بنكمل التأكيد...'}
                      </div>
                   ) : (isTextRequestCheckout ? (isPharmacyTextRequestCheckout ? 'إرسال طلب التسعير' : 'ابعت طلب بحث') : (isGroupOrderCheckout ? 'تأكيد الطلب الجماعي' : 'تأكيد الطلب'))}
                </Button>
            </div>
         </div>
         <Footer />
      </>
   )
}

