import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, isLoading, scrollTrigger, onType }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading, scrollTrigger]);

  return (
    <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 0', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '0 24px' }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onType={onType} />
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px 18px 18px 18px',
                width: 'fit-content',
                marginLeft: '4px',
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    display: 'inline-block',
                    animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
