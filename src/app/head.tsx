const HERO_IMAGE_URL = "/hero-shopping-box.webp";

export default function Head() {
  return (
    <>
      <link rel="preload" as="image" href={HERO_IMAGE_URL} fetchPriority="high" />
    </>
  );
}
