'use client'

/**
 * Full-viewport background video with a dark, blurred overlay ("Premium" layer)
 * so the car video stays subtle and white text remains readable.
 * Replaces AtmoBlobs. Uses car-bg.mp4 from /public.
 */
export function BackgroundVideo() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -50 }}
      aria-hidden="true"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/car-bg.mp4"
      />
      {/* Premium overlay: stronger on mobile (70%) for text legibility on bright video; 60% on md+ */}
      <div
        className="absolute inset-0 bg-slate-950/70 md:bg-slate-950/60 backdrop-blur-[2px]"
        aria-hidden="true"
      />
    </div>
  )
}
