export default function VoiceToggle({ mode, onChange }) {
  const base = {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background 0.15s',
  };
  const active = { ...base, background: '#6366f1', color: 'white' };
  const inactive = { ...base, background: '#6b7280', color: 'white' };

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button style={mode === 'text' ? active : inactive} onClick={() => onChange('text')}>
        Text
      </button>
      <button style={mode === 'voice' ? active : inactive} onClick={() => onChange('voice')}>
        Voice
      </button>
    </div>
  );
}
