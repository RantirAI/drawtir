import { useEffect, useRef, useState } from "react";

interface Props {
  frontImage: string;
  backImage: string;
}

/**
 * Lightweight CSS 3D rotating preview. Two image faces are placed back-to-back
 * (front at z=+1, back rotated 180° at z=-1) and the whole group spins on Y.
 * Drag to rotate manually, release to resume auto-rotate.
 */
export default function Merch3DPreview({ frontImage, backImage }: Props) {
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const dragRef = useRef<{ x: number; rot: number } | null>(null);

  useEffect(() => {
    if (!autoRotate) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation((r) => r + dt * 30);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  const onPointerDown = (e: React.PointerEvent) => {
    setAutoRotate(false);
    dragRef.current = { x: e.clientX, rot: rotation };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    setRotation(dragRef.current.rot + dx * 0.5);
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setTimeout(() => setAutoRotate(true), 1500);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10 rounded-lg overflow-hidden">
      <div
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{ width: 320, height: 320, perspective: 1200 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: dragRef.current ? "none" : undefined,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "translateZ(2px)",
            }}
          >
            <img
              src={frontImage}
              alt="Front"
              draggable={false}
              className="w-full h-full object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(2px)",
            }}
          >
            <img
              src={backImage}
              alt="Back"
              draggable={false}
              className="w-full h-full object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Drag to rotate
      </div>
    </div>
  );
}
