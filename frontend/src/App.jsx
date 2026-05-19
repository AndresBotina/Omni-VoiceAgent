import { useState } from 'react';
import { sendMessage, ingestUrl as ingestUrlApi, generateSessionId } from './services/api.js';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import './App.css';

const SESSION_ID = generateSessionId();

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestStatus, setIngestStatus] = useState(null);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed, tool_used: null, audio: null },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessage({ session_id: SESSION_ID, message: trimmed, mode });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          tool_used: result.tool_used,
          audio: result.audio,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message}`, tool_used: null, audio: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const inputBox = (
    <div className="input-inner">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Ask about any city, transport, weather or places..."
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setMode(mode === 'text' ? 'voice' : 'text')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: mode === 'voice' ? 'var(--accent-light)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          Voice response
        </button>
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
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '0 24px 24px',
          }}>
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
          <>
            <div style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-light)' }}>Omni</span>
            </div>
            <ChatWindow messages={messages} isLoading={isLoading} />
            <div className="input-area">
              {inputBox}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
