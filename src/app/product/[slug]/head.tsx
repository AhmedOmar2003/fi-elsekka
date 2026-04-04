import { getImageProps } from "next/image"
import { fetchProductDetails } from "@/services/productsService"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fi-elsekka.vercel.app"

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`
}

export default async function Head({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await fetchProductDetails(slug)
  const heroImage = toAbsoluteUrl(product?.image_url || product?.images?.[0] || "")
  const imageSizes = "(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) 46vw, 42vw"

  if (!heroImage) return null

  let preconnectOrigin = ""

  try {
    preconnectOrigin = new URL(heroImage).origin
  } catch {
    preconnectOrigin = ""
  }

  const { props: imageProps } = getImageProps({
    src: heroImage,
    alt: product?.name || "صورة المنتج",
    width: 1200,
    height: 900,
    quality: 58,
    sizes: imageSizes,
  })

  return (
    <>
      {preconnectOrigin ? <link rel="preconnect" href={preconnectOrigin} crossOrigin="" /> : null}
      {preconnectOrigin ? <link rel="dns-prefetch" href={preconnectOrigin} /> : null}
      <link
        rel="preload"
        as="image"
        href={imageProps.src}
        imageSrcSet={imageProps.srcSet}
        imageSizes={imageProps.sizes}
        fetchPriority="high"
      />
    </>
  )
}
