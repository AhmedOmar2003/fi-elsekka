"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ImagePlus, NotebookPen, Pill, ShoppingBasket, Sparkles, Trash2 } from "lucide-react"
import {
  getTextRequestCategoryConfig,
  TEXT_CATEGORY_ORDER_MODE,
  uploadTextCategoryRequestImage,
  writeTextCategoryOrderDraft,
} from "@/lib/text-category-orders"

type RequestCategory = {
  id: string
  name: string
}

export function CategoryRequestPanel({
  category,
  compact = false,
}: {
  category: RequestCategory
  compact?: boolean
}) {
  const router = useRouter()
  const textRequestCategoryConfig = React.useMemo(
    () => getTextRequestCategoryConfig(category.name),
    [category.name]
  )

  const [textRequest, setTextRequest] = React.useState("")
  const [requestImageUrls, setRequestImageUrls] = React.useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = React.useState(false)
  const [requestError, setRequestError] = React.useState("")

  const canContinueTextRequest = React.useMemo(() => {
    if (!textRequestCategoryConfig) return false
    const hasText = textRequest.trim().length >= (textRequestCategoryConfig.requireText ? 12 : 1)
    const hasImages = requestImageUrls.length > 0
    return textRequestCategoryConfig.requireText ? hasText : hasText || hasImages
  }, [requestImageUrls.length, textRequest, textRequestCategoryConfig])

  React.useEffect(() => {
    setTextRequest("")
    setRequestImageUrls([])
    setRequestError("")

    try {
      const raw = window.sessionStorage.getItem(`text-category-order-draft:${category.id}`)
      if (!raw) return
      const draft = JSON.parse(raw) as { requestText?: string; imageUrls?: string[] }
      if (draft?.requestText) {
        setTextRequest(draft.requestText)
      }
      setRequestImageUrls(Array.isArray(draft?.imageUrls) ? draft.imageUrls.filter(Boolean) : [])
    } catch {
      // Ignore malformed draft state
    }
  }, [category.id])

  const handleUploadRequestImages = async (files: FileList | null) => {
    if (!files || !textRequestCategoryConfig?.allowImages) return

    const selectedFiles = Array.from(files)
    const availableSlots = Math.max((textRequestCategoryConfig.maxImages || 0) - requestImageUrls.length, 0)

    if (availableSlots <= 0) {
      setRequestError(`يمكنك رفع ${textRequestCategoryConfig.maxImages} صور فقط لهذا الطلب.`)
      return
    }

    const validFiles = selectedFiles.slice(0, availableSlots)
    const invalidType = validFiles.find(file => !file.type.startsWith('image/'))

    if (invalidType) {
      setRequestError('ارفع صورًا واضحة فقط بصيغة صور فعلية مثل JPG أو PNG.')
      return
    }

    setRequestError('')
    setIsUploadingImages(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of validFiles) {
        const uploadedUrl = await uploadTextCategoryRequestImage(category.id, file)
        if (!uploadedUrl) {
          throw new Error('تعذر رفع إحدى الصور. حاول مرة أخرى بصورة أوضح أو بعد تسجيل الدخول.')
        }
        uploadedUrls.push(uploadedUrl)
      }

      setRequestImageUrls(prev => [...prev, ...uploadedUrls].slice(0, textRequestCategoryConfig.maxImages))
    } catch (error: any) {
      setRequestError(error.message || 'تعذر رفع الصور الآن.')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleRemoveRequestImage = (imageUrl: string) => {
    setRequestImageUrls(prev => prev.filter(url => url !== imageUrl))
  }

  const handleContinueTextOrder = () => {
    const normalizedText = textRequest.trim()
    const hasImages = requestImageUrls.length > 0
    const requiresText = Boolean(textRequestCategoryConfig?.requireText)

    if (!textRequestCategoryConfig) return
    if (requiresText && normalizedText.length < 12) {
      setRequestError('اكتب الطلب بشكل واضح قبل المتابعة.')
      return
    }
    if (!requiresText && normalizedText.length === 0 && !hasImages) {
      setRequestError('اكتب طلبك أو ارفع صورة واحدة واضحة على الأقل قبل المتابعة.')
      return
    }

    writeTextCategoryOrderDraft({
      categoryId: category.id,
      categoryName: category.name,
      requestText: normalizedText,
      imageUrls: requestImageUrls,
    })

    router.push(`/checkout?requestMode=${TEXT_CATEGORY_ORDER_MODE}&categoryId=${category.id}`)
  }

  if (!textRequestCategoryConfig) {
    return null
  }

  const isPharmacy = category.name === 'صيدلية'

  return (
    <div className={compact ? "mx-auto max-w-3xl" : "mx-auto max-w-4xl"}>
      <div className="rounded-[2rem] border border-surface-hover bg-surface p-5 shadow-premium sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            {isPharmacy ? <Pill className="h-7 w-7" /> : <ShoppingBasket className="h-7 w-7" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-foreground">
              {isPharmacy ? "ابعت طلبك الصيدلي" : "ابعت طلبك بسهولة"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {isPharmacy
                ? "اكتب أسماء الأدوية أو ارفع صورة الروشتة، وإحنا هنراجع الطلب ونرجعلك بالسعر قبل التأكيد."
                : "اكتب المنتج اللي محتاجه أو ارفع صورته، وإحنا هندور عليه ونرجعلك بالسعر قبل ما تكمل."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-black text-primary">1. اكتب الطلب</p>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {isPharmacy
                ? "اسم الدواء أو التركيز أو أي ملاحظة مهمة."
                : "اسم المنتج أو وصفه أو الماركة أو المقاس لو تعرفه."}
            </p>
          </div>
          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-black text-primary">2. ارفع صورة لو حبيت</p>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {isPharmacy
                ? "الروشتة أو العبوة تكون واضحة ومقروءة."
                : "صورة واضحة للمنتج تساعدنا نوصله أسرع."}
            </p>
          </div>
          <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-black text-primary">3. ابعت الطلب</p>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {isPharmacy
                ? "هنراجع الطلب ونقولك السعر، وبعدها أنت تقرر نكمل أو لأ."
                : "هنرد عليك لو لقيناه ونوضح السعر قبل أي تأكيد."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-surface-hover bg-background/70 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-black">مثال سريع</p>
          </div>
          <div className="mt-3 text-sm leading-7 text-gray-500">
            {isPharmacy ? (
              <>
                أوجمنتين 1 جم - عبوة
                <br />
                بروفين شراب للأطفال
                <br />
                ولو فيه بديل، كلموني الأول
              </>
            ) : (
              <>
                عاوز تيشيرت أسود قطن مقاس L
                <br />
                أو لعبة تركيب مناسبة لطفل 7 سنين
                <br />
                أو سماعة بلوتوث لون أسود
              </>
            )}
          </div>
        </div>

        {textRequestCategoryConfig.allowText && (
          <div className="mt-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
              <NotebookPen className="h-4 w-4 text-primary" />
              {isPharmacy ? "اكتب طلبك أو أسماء الأدوية" : "اكتب المنتج اللي محتاجه"}
            </label>
            <textarea
              value={textRequest}
              onChange={(e) => setTextRequest(e.target.value)}
              rows={isPharmacy ? 8 : 6}
              placeholder={
                isPharmacy
                  ? `مثال:\nأوجمنتين 1 جم - عبوة\nكونجستال - 2 شريط\nلو في بديل كلموني الأول`
                  : `مثال:\nتيشيرت أسود قطن مقاس L\nأو خلاط يدوي ماركة معروفة\nأو لعبة مناسبة لطفل 7 سنين`
              }
              className="w-full resize-none rounded-[1.5rem] border border-surface-hover bg-background px-4 py-4 text-sm leading-7 text-foreground outline-none transition-colors focus:border-primary/40"
            />
            <p className="mt-2 text-xs text-gray-500">
              {isPharmacy
                ? "كل ما كتبت الاسم أو التركيز بشكل أوضح، هيساعدنا نراجع الطلب أسرع."
                : "وصف بسيط وواضح يكفّي جدًا، ومش لازم تكتب كلام كثير."}
            </p>
          </div>
        )}

        {textRequestCategoryConfig.allowImages && (
          <div className="mt-6">
            <label className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
              <ImagePlus className="h-4 w-4 text-primary" />
              {isPharmacy ? "ارفع صورة الروشتة أو العبوة" : "ارفع صور المنتج لو متاحة"}
            </label>
            <div className="rounded-[1.5rem] border border-dashed border-primary/25 bg-background/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-foreground">حتى 3 صور واضحة</p>
                  <p className="mt-1 text-xs leading-6 text-gray-500">
                    {isPharmacy
                      ? "صوّر الروشتة كاملة وبوضوح. لو الصورة مش مقروءة، المراجعة هتتأخر."
                      : "ارفع صورة أو أكثر لو هتساعدنا نفهم المنتج بشكل أسرع."}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-black text-primary transition-colors hover:bg-primary hover:text-white">
                  {isUploadingImages ? "جاري الرفع..." : "اختيار الصور"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploadingImages || requestImageUrls.length >= (textRequestCategoryConfig.maxImages || 0)}
                    onChange={(event) => {
                      handleUploadRequestImages(event.target.files)
                      event.currentTarget.value = ""
                    }}
                  />
                </label>
              </div>

              {requestImageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {requestImageUrls.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-2xl border border-surface-hover bg-surface">
                      <img src={imageUrl} alt={`مرفق الطلب ${index + 1}`} className="h-32 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveRequestImage(imageUrl)}
                        className="absolute left-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-rose-500 shadow-sm transition-colors hover:bg-rose-500 hover:text-white"
                        aria-label="حذف الصورة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {requestError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {requestError}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-xs font-black text-amber-500">مهم</p>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            {isPharmacy
              ? "لو في أي حاجة مش واضحة في الروشتة، هنتواصل معاك الأول قبل ما نكمل."
              : "مش هتدفع دلوقتي. هنرجعلك الأول لو لقينا الطلب ونوضح السعر."}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {isPharmacy
              ? "بعد المراجعة هنقولك السعر وتكمل براحتك."
              : "بعد ما نلاقي الطلب هنبلغك بالسعر وأنت تقرر تكمل أو لأ."}
          </p>
          <Button
            onClick={handleContinueTextOrder}
            disabled={!canContinueTextRequest || isUploadingImages}
            className="rounded-2xl px-6 py-6 text-sm font-black"
          >
            {isPharmacy ? "ابعت طلبك" : "ابعت الطلب"}
          </Button>
        </div>
      </div>
    </div>
  )
}
