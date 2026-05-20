import { useState } from 'react';

// SVG icon components — inline to avoid external dependencies
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const KnowledgeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const LogoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
);

// Navigation items — id maps to activeSection state
const NAV_ITEMS = [
  { icon: <ChatIcon />, label: 'Chat', id: 'chat' },
  { icon: <KnowledgeIcon />, label: 'Sources', id: 'knowledge' },
];

export default function Sidebar({ isOpen, onToggle, onIngest }) {
  // activeSection: which nav item is highlighted and which panel is shown
  // kbUrl / kbStatus: ingest panel URL input and last ingest result message
  const [activeSection, setActiveSection] = useState('chat');
  const [kbUrl, setKbUrl] = useState('');
  const [kbStatus, setKbStatus] = useState(null);
  const [ingestedSources, setIngestedSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem('omni_sources') || '[]') }
    catch { return [] }
  });

  // Calls the parent's onIngest handler and shows success/error status
  const handleIngest = async () => {
    if (!kbUrl.trim()) return;
    setKbStatus('Ingesting…');
    try {
      const result = await onIngest(kbUrl.trim());
      setKbStatus(`✓ ${result.chunks_ingested} chunks ingested`);
      const newSources = [...ingestedSources, kbUrl.trim()];
      setIngestedSources(newSources);
      localStorage.setItem('omni_sources', JSON.stringify(newSources));
      setKbUrl('');
    } catch (e) {
      setKbStatus(`✗ ${e.message}`);
    }
  };

  const handleRemoveSource = (index) => {
    const newSources = ingestedSources.filter((_, i) => i !== index);
    setIngestedSources(newSources);
    localStorage.setItem('omni_sources', JSON.stringify(newSources));
    setKbStatus('Removed');
    setTimeout(() => setKbStatus(null), 1000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isOpen ? '220px' : '64px',  // collapses to icon-only strip
        transition: 'width 0.3s ease',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo — clicking toggles the sidebar open/closed */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '20px 16px',
          fontWeight: 700,
          fontSize: '15px',
          color: 'var(--accent-light)',
          cursor: 'pointer',
          borderBottom: '1px solid var(--border)',
          whiteSpace: 'nowrap',
        }}
      >
        <LogoIcon />
      </div>

      {/* Nav items — clicking Knowledge auto-expands sidebar if collapsed */}
      <nav style={{ paddingTop: '8px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                if (item.id === 'knowledge' && !isOpen) onToggle();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                margin: '2px 8px',
                fontSize: '14px',
                color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                justifyContent: isOpen ? 'flex-start' : 'center',
              }}
            >
              <span>{item.icon}</span>
              {isOpen && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Ingest panel — only visible when sidebar is expanded and Sources is active */}
      {isOpen && activeSection === 'knowledge' && (
        <div style={{ padding: '0 8px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '8px 8px 4px' }}>
            Knowledge Base
          </div>
          <input
            type="text"
            value={kbUrl}
            onChange={(e) => setKbUrl(e.target.value)}
            placeholder="Paste a URL to ingest..."
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '100%',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleIngest}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '6px',
            }}
          >
            Ingest
          </button>
          {kbStatus && (
            <p style={{ fontSize: '11px', color: 'var(--success)', margin: '6px 0 0' }}>{kbStatus}</p>
          )}
          <div style={{ marginTop: '10px' }}>
            {ingestedSources.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, padding: '0 4px' }}>
                No sources added yet
              </p>
            ) : (
              ingestedSources.map((url, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {url}
                  </span>
                  <button
                    onClick={() => handleRemoveSource(i)}
                    style={{
                      color: 'var(--text-muted)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0 4px',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
