const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1628102491629-778571d893a3?q=72&w=640&auto=format&fit=crop";

export default function Head() {
  return (
    <>
      <link rel="preconnect" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="preload" as="image" href={HERO_IMAGE_URL} fetchPriority="high" />
    </>
  );
}
