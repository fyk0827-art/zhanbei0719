import { lazy, Suspense, useEffect, useRef, useState } from "react";

const PlanetCharactersSection = lazy(() => import("@/components/PlanetCharactersSection"));

export default function DeferredPlanetCharacters() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: "0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinelRef}>
      {shouldRender ? (
        <Suspense fallback={null}>
          <PlanetCharactersSection />
        </Suspense>
      ) : null}
    </div>
  );
}
