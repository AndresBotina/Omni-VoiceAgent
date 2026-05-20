import { useEffect, useRef, useState, useMemo } from 'react';

const BAR_COUNT = 40;

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function AudioPlayer({ audioBase64, isPremium }) {
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
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 300);

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
    <div style={{ marginTop: '8px', maxWidth: '280px' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', padding: '4px 0' }}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          style={{
            fontSize: '18px',
            color: isPlaying ? (isPremium ? '#f59e0b' : 'var(--accent-light)') : (isPremium ? 'rgba(245,158,11,0.45)' : 'rgba(167,139,250,0.45)'),
            transition: 'color 0.4s ease',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            width: '24px',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Waveform bars */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '40px' }}>
          {barHeights.map((h, i) => {
            const ended = duration > 0 && currentTime === duration;
            const played = i / BAR_COUNT <= progress;
            const barColor = ended
              ? (isPremium ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.25)')
              : played
                ? (isPremium ? '#f59e0b' : '#7C3AED')
                : (isPremium ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)');
            return (
              <div
                key={i}
                onClick={() => {
                  if (audioRef.current && duration > 0) {
                    const seekTime = (i / BAR_COUNT) * duration;
                    audioRef.current.currentTime = seekTime;
                    setCurrentTime(seekTime);
                  }
                }}
                style={{
                  width: '3px',
                  height: `${h}px`,
                  borderRadius: '3px',
                  background: barColor,
                  opacity: 1,
                  transformOrigin: 'center',
                  cursor: 'pointer',
                  animation: played && isPlaying
                    ? `waveBar 0.8s ease-in-out ${(i % 8) * 0.1}s infinite`
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Alien ship icon */}
        <div style={{ flexShrink: 0, transition: 'transform 1.5s ease-in-out' }} className={isPlaying ? 'levitating' : ''}>
        <svg width="28" height="28" viewBox="0 0 100 100">
          <ellipse cx="35" cy="72" rx="6" ry="4" fill="#A78BFA" opacity="0.9"/>
          <ellipse cx="50" cy="76" rx="6" ry="4" fill="#7C3AED" opacity="0.9"/>
          <ellipse cx="65" cy="72" rx="6" ry="4" fill="#A78BFA" opacity="0.9"/>
          <ellipse cx="50" cy="60" rx="35" ry="14" fill="#4F46E5"/>
          <ellipse cx="50" cy="58" rx="35" ry="13" fill="#6366F1"/>
          <ellipse cx="50" cy="52" rx="18" ry="6" fill="#818CF8"/>
          <path d="M32 52 Q50 28 68 52" fill="#7C3AED"/>
          <path d="M35 50 Q50 30 65 50" fill="#A78BFA" opacity="0.6"/>
          <ellipse cx="50" cy="44" rx="8" ry="5" fill="#C4B5FD" opacity="0.5"/>
          <ellipse cx="50" cy="60" rx="35" ry="5" fill="#4338CA" opacity="0.5"/>
        </svg>
        </div>
      </div>

      {/* Time display */}
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', paddingLeft: '28px' }}>
        {formatTime(currentTime)}
      </div>
    </div>
  );
}
