import { useState, useRef } from 'react';

/**
 * Card3D: Wraps any content with a realistic 3D tilt and dynamic specular light sheen
 */
export default function Card3D({
  children,
  className = '',
  style = {},
  maxTilt = 10,
  glare = true,
  depth = 20,
  onClick = undefined,
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      x: rotateX,
      y: rotateY,
      glareX,
      glareY,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-3d-wrapper ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease-out',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.opacity > 0 ? depth : 0}px)`,
          transition: tilt.opacity === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
          transformStyle: 'preserve-3d',
          position: 'relative',
          height: '100%',
          width: '100%',
        }}
      >
        {children}

        {glare && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, ${tilt.opacity}) 0%, transparent 60%)`,
              transition: 'opacity 0.25s ease',
              mixBlendMode: 'overlay',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}
