import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const TRIMESTER_DATA = {
  1: { range: 'Week 1 - 13', title: '1st Trimester — Foundation & Cell Genesis', icon: '🌱', size: 'Lime (5 cm)', weight: '14 g', bpm: 155 },
  2: { range: 'Week 14 - 27', title: '2nd Trimester — Movement & Golden Bloom', icon: '🌽', size: 'Ear of Corn (30 cm)', weight: '600 g', bpm: 142 },
  3: { range: 'Week 28 - 40+', title: '3rd Trimester — Final Flourish & Readiness', icon: '🍉', size: 'Watermelon (50 cm)', weight: '3200 g', bpm: 135 },
};

export default function FetalHeartbeatCard({ week = 24 }) {
  const [kicks, setKicks] = useState(7);
  const [isBeating, setIsBeating] = useState(true);

  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const currentData = TRIMESTER_DATA[trimester];

  const handleRecordKick = () => {
    setKicks((k) => k + 1);
    toast.success(`✨ Baby Kick #${kicks + 1} recorded! Strong and healthy rhythm 🌸`);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#e8639a', '#f5a7c8', '#b48dd8'],
    });
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(254, 242, 248, 0.92))',
        border: '1px solid rgba(232, 99, 154, 0.22)',
        boxShadow: '0 14px 40px rgba(232, 99, 154, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background 3D Glow Orb */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 99, 154, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>💓</span>
            <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>
              Fetal Vitals & Development
            </h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Week {week} • {currentData.title}
          </p>
        </div>

        <span
          style={{
            padding: '5px 12px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(232, 99, 154, 0.15), rgba(155, 114, 207, 0.15))',
            color: 'var(--accent-rose)',
            fontSize: '0.78rem',
            fontWeight: 700,
            border: '1px solid rgba(232, 99, 154, 0.25)',
          }}
        >
          Trimester {trimester}
        </span>
      </div>

      {/* 3D Development Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(232, 99, 154, 0.15)',
            boxShadow: '0 4px 12px rgba(155, 114, 207, 0.06)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>{currentData.icon}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Baby Size</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {currentData.size}
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(61, 191, 168, 0.2)',
            boxShadow: '0 4px 12px rgba(61, 191, 168, 0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>⚖️</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Est. Weight</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2aaa8f', marginTop: 2 }}>
            {currentData.weight}
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(155, 114, 207, 0.2)',
            boxShadow: '0 4px 12px rgba(155, 114, 207, 0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>👶</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fetal Rate</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9b72cf', marginTop: 2 }}>
            ~{currentData.bpm} BPM
          </div>
        </div>
      </div>

      {/* Simulated Live Heartbeat Waveform */}
      <div
        style={{
          borderRadius: 16,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #2d1339, #1f0b27)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(45, 19, 57, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 10px #4ade80',
                display: 'inline-block',
                animation: 'pulseGlow 1.2s infinite',
              }}
            />
            <span style={{ fontSize: '0.82rem', letterSpacing: '0.5px', color: '#fbcfe8', fontWeight: 600 }}>
              DOPPLER MONITOR SIMULATION
            </span>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f472b6', fontFamily: 'monospace' }}>
            {currentData.bpm} <span style={{ fontSize: '0.72rem', color: '#e9d5ff' }}>BPM</span>
          </span>
        </div>

        {/* SVG Pulse Line with soft glow */}
        <div style={{ width: '100%', height: 48, position: 'relative' }}>
          <svg
            viewBox="0 0 500 50"
            style={{ width: '100%', height: '100%', stroke: '#f472b6', strokeWidth: 2.2, fill: 'none' }}
          >
            <path
              d="M 0 25 L 60 25 L 75 10 L 90 40 L 105 5 L 120 45 L 135 25 L 200 25 L 215 10 L 230 40 L 245 5 L 260 45 L 275 25 L 340 25 L 355 10 L 370 40 L 385 5 L 400 45 L 415 25 L 500 25"
              strokeDasharray="500"
              strokeDashoffset="0"
              style={{ animation: 'ekgMove 3s linear infinite' }}
            />
          </svg>
        </div>
      </div>

      {/* Kick Counter & Interactive Tactile Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(232, 99, 154, 0.18)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Today's Kick Count</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', fontFamily: 'Playfair Display, serif' }}>
            {kicks} gentle kicks
          </div>
        </div>

        <button
          onClick={handleRecordKick}
          className="btn-3d-push"
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #e8639a, #d94f7e)',
            color: 'white',
            borderRadius: 12,
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(232, 99, 154, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🦶</span> Log Baby Kick
        </button>
      </div>
    </div>
  );
}
