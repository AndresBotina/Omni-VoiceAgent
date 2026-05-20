import { useState } from 'react';
import { sendMessage, ingestUrl as ingestUrlApi, generateSessionId } from './services/api.js';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import './App.css';

// Single session ID generated once per page load — persists across messages
const SESSION_ID = generateSessionId();

export default function App() {
  // messages: full conversation history rendered by ChatWindow
  // input: current textarea value
  // mode: "text" (default) or "voice" (triggers TTS on response)
  // isLoading: disables send while waiting for a response
  // sidebarOpen: controls sidebar width (220px expanded / 64px collapsed)
  // ingestUrl / ingestStatus: track the last ingested URL and its result
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestStatus, setIngestStatus] = useState(null);
  const [premiumVoice, setPremiumVoice] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Append user message immediately for instant feedback
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed, tool_used: null, audio: null },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessage({ session_id: SESSION_ID, message: trimmed, mode, voice_mode: premiumVoice ? "premium" : "standard" });
      // Append assistant response including optional tool name and audio
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          tool_used: result.tool_used,
          audio: result.audio,
          isPremium: premiumVoice,
        },
      ]);
      setScrollTrigger((prev) => prev + 1);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message}`, tool_used: null, audio: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit on Enter, allow Shift+Enter for newlines
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleIngest = async (url) => {
    const result = await ingestUrlApi(url);
    setIngestUrl(url);
    setIngestStatus(`✓ Ingested ${result.chunks_ingested} chunks.`);
    return result;
  };

  // Reusable input box: textarea + voice toggle + send button
  // Rendered in the centered welcome state AND the bottom bar during chat
  const inputBox = (
    <div
      className="input-inner"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: isFocused
          ? '1px solid rgba(255,255,255,0.2)'
          : isHovered
          ? '1px solid rgba(255,255,255,0.15)'
          : '1px solid var(--border)',
        boxShadow: 'none',
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={2}
        placeholder="Ask about any city, transport, weather or places..."
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Voice response button: activates standard TTS */}
          <button
            onClick={() => {
              if (mode === 'voice' && !premiumVoice) { setMode('text'); setPremiumVoice(false); }
              else { setMode('voice'); setPremiumVoice(false); }
            }}
            style={{
              background: mode === 'voice' && !premiumVoice ? 'linear-gradient(135deg, #6366f1, #7C3AED)' : 'transparent',
              border: mode === 'voice' && !premiumVoice ? '1px solid #6366f1' : '1px solid var(--border)',
              color: mode === 'voice' && !premiumVoice ? 'white' : 'var(--text-muted)',
              boxShadow: mode === 'voice' && !premiumVoice ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {mode === 'voice' && !premiumVoice ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" style={{ animation: 'waveIn 0.6s ease forwards', opacity: 0 }}/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" style={{ animation: 'waveIn 0.6s ease 0.2s forwards', opacity: 0 }}/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              </svg>
            )}
            Voice response
          </button>
          {/* Premium voice button: activates ElevenLabs TTS */}
          <button
            onClick={() => {
              if (premiumVoice) { setMode('text'); setPremiumVoice(false); }
              else { setMode('voice'); setPremiumVoice(true); }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              borderRadius: '999px',
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: premiumVoice ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              border: premiumVoice ? '1px solid #f59e0b' : '1px solid var(--border)',
              color: premiumVoice ? 'white' : 'var(--text-muted)',
              boxShadow: premiumVoice ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
            }}
          >
            <svg
              key={premiumVoice ? 'active' : 'inactive'}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{
                animation: premiumVoice ? 'crownPop 0.5s ease forwards' : 'none',
                display: 'inline-block'
              }}
            >
              <path d="M2 19h20v2H2zM2 6l5 7 5-7 5 7 5-7v11H2z"/>
            </svg>
            Voice Premium
          </button>
        </div>
        {/* Send button: accent-colored when input has text, transparent when empty */}
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={isLoading}
          style={{ background: input.trim() ? 'var(--accent)' : 'transparent' }}
        >
          ➤
        </button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((p) => !p)}
        mode={mode}
        onModeChange={setMode}
        onIngest={handleIngest}
      />
      <main
        className="main-content"
        style={{ marginLeft: sidebarOpen ? '220px' : '64px' }}
      >
        {/* Empty state: centered welcome screen with animated title and input */}
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '0 24px 24px',
          }}>
            {/* Animated wave title — each letter floats independently */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '32px',
              letterSpacing: '-0.5px',
              display: 'flex',
              gap: '1px',
            }}>
              {['O', 'm', 'n', 'i'].map((letter, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    color: letter === 'i' ? 'var(--accent-light)' : 'var(--text-primary)',
                    animation: 'waveFloat 2.5s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  {letter}
                </span>
              ))}
            </h1>
            {inputBox}
          </div>
        ) : (
          // Chat state: minimal top bar + message list + bottom input
          <>
            <div style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-light)' }}>Omni</span>
            </div>
            <ChatWindow
                messages={messages}
                isLoading={isLoading}
                scrollTrigger={scrollTrigger}
                onType={() => setScrollTrigger(prev => prev + 1)}
              />
            <div className="input-area">
              {inputBox}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
