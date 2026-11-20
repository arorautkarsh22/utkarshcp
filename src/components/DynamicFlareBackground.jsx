import { useEffect, useRef } from 'react';
import './DynamicFlareBackground.css';

export default function DynamicFlareBackground() {
  const spotlightRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    let rafId;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const updatePosition = () => {
      // Smooth lerp for fluid cursor follow
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="dynamic-flare-bg" ref={containerRef} aria-hidden="true">
      {/* Dynamic Drifting Light Flares */}
      <div className="flare-orb flare-orb--amber" />
      <div className="flare-orb flare-orb--indigo" />
      <div className="flare-orb flare-orb--rose" />
      <div className="flare-orb flare-orb--violet" />
      <div className="flare-orb flare-orb--accent" />

      {/* Interactive Cursor Spotlight */}
      <div className="flare-spotlight" ref={spotlightRef} />

      {/* Subtle Ambient Vignette & Noise Texture */}
      <div className="flare-vignette" />
      <div className="flare-grain" />
    </div>
  );
}
