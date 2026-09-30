import { useState } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function HydrationTumbler3D({ currentMl = 1750, targetMl = 2500, onAddWater }) {
  const [water, setWater] = useState(currentMl);
  const percentage = Math.min(Math.round((water / targetMl) * 100), 100);

  const addAmount = (ml) => {
    const next = water + ml;
    setWater(next);
    if (onAddWater) onAddWater(ml);

    if (next >= targetMl && water < targetMl) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3dbfa8', '#6dcfb8', '#a8edea', '#ffffff'],
      });
      toast.success('💧 Daily Hydration Goal Achieved! Wonderful job for you & baby! 🌸');
    } else {
      toast.success(`+${ml}ml water logged 💧`);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 250, 0.9))',
        border: '1px solid rgba(61, 191, 168, 0.25)',
        boxShadow: '0 12px 36px rgba(61, 191, 168, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>💧</span> 3D Hydration Visualizer
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Optimal amniotic fluid & maternal energy</p>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(61, 191, 168, 0.15)',
            color: '#2aaa8f',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          {percentage}% Target
        </span>
      </div>

      {/* 3D Realistic Glass Tumbler */}
      <div
        style={{
          width: 140,
          height: 180,
          borderRadius: '16px 16px 28px 28px',
          background: 'rgba(255, 255, 255, 0.4)',
          border: '3px solid rgba(255, 255, 255, 0.85)',
          boxShadow: `
            0 16px 32px rgba(61, 191, 168, 0.18),
            inset 4px 4px 12px rgba(255, 255, 255, 0.9),
            inset -4px -4px 12px rgba(61, 191, 168, 0.2)
          `,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          margin: '10px 0 18px',
          perspective: '600px',
        }}
      >
        {/* Specular glass reflection line */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            width: 8,
            bottom: 20,
            borderRadius: 6,
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.15))',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />

        {/* Measurement ticks */}
        {[2000, 1500, 1000, 500].map((ml) => (
          <div
            key={ml}
            style={{
              position: 'absolute',
              bottom: `${(ml / targetMl) * 100}%`,
              right: 8,
              fontSize: '0.62rem',
              color: 'rgba(61, 191, 168, 0.7)',
              fontWeight: 600,
              zIndex: 6,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{ml}</span>
            <div style={{ width: 6, height: 1.5, background: 'rgba(61, 191, 168, 0.6)' }} />
          </div>
        ))}

        {/* Animated 3D Liquid with wave */}
        <div
          style={{
            width: '100%',
            height: `${Math.max(percentage, 8)}%`,
            background: 'linear-gradient(180deg, #5fe3cb 0%, #3dbfa8 60%, #209985 100%)',
            position: 'relative',
            transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 -4px 16px rgba(61, 191, 168, 0.4)',
          }}
        >
          {/* Wave top */}
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: 0,
              right: 0,
              height: 12,
              borderRadius: '50%',
              background: '#8ff5e1',
              boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.8)',
            }}
          />

          {/* Bubbles */}
          <div
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '30%',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.6)',
              animation: 'floatBubble 3s infinite ease-in-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '40%',
              left: '60%',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.5)',
              animation: 'floatBubble 2.4s infinite ease-in-out 0.8s',
            }}
          />
        </div>
      </div>

      {/* Stats display */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#209985', fontFamily: 'Playfair Display, serif' }}>
          {water}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 4 }}>
          / {targetMl} ml
        </span>
      </div>

      {/* Quick Add Buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button
          onClick={() => addAmount(250)}
          className="btn-3d-push"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #4ed3bc, #2cb098)',
            color: 'white',
            borderRadius: 12,
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(61, 191, 168, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🥛</span> +250 ml
        </button>

        <button
          onClick={() => addAmount(500)}
          className="btn-3d-push"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #9b72cf, #8053ba)',
            color: 'white',
            borderRadius: 12,
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(155, 114, 207, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🍶</span> +500 ml
        </button>
      </div>
    </div>
  );
}
