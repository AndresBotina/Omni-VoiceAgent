import { useEffect, useRef, useState, useMemo } from 'react';

const BAR_COUNT = 40;

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function AudioPlayer({ audioBase64 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const barHeights = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => Math.floor(Math.random() * 32) + 8),
    []
  );

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes waveBar {
        0%, 100% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!audioBase64) return;

    const bytes = atob(audioBase64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;
    }

    const timer = setTimeout(() => {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    }, 100);

    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [audioBase64]);

  if (!audioBase64) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };


  return (
    <div style={{ animation: 'fadeInUp 0.4s ease', animationFillMode: 'both' }}>
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        maxWidth: '320px',
        marginTop: '10px',
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '40px',
          }}
        >
          {barHeights.map((h, i) => {
            const played = i / BAR_COUNT <= progress;
            return (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${h}px`,
                  borderRadius: '3px',
                  background: played ? 'var(--accent)' : '#334155',
                  opacity: 1,
                  transformOrigin: 'center',
                  animation: played && isPlaying
                    ? `waveBar 0.8s ease-in-out ${(i % 8) * 0.1}s infinite`
                    : 'none',
                }}
              />
            );
          })}
        </div>

        <button
          onClick={togglePlay}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '10px',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
        {formatTime(currentTime)}
      </div>
    </div>
    </div>
  );
}
