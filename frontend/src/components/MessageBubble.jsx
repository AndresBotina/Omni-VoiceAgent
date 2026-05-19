import ToolIndicator from './ToolIndicator';
import AudioPlayer from './AudioPlayer';

function parseMarkdown(text) {
  return text
    .replace(/^### (.*?)$/gm, '<strong style="display:block;margin-top:10px;margin-bottom:4px;color:#A78BFA">$1</strong>')
    .replace(/^## (.*?)$/gm, '<strong style="display:block;margin-top:12px;margin-bottom:4px;font-size:15px;color:#A78BFA">$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*?)$/gm, '<span style="display:block;padding-left:12px;margin:2px 0">• $1</span>')
    .replace(/\n/g, '<br/>');
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', animation: 'fadeInUp 0.25s ease' }}>
        <div
          style={{
            background: 'var(--accent)',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '18px 4px 18px 18px',
            maxWidth: '70%',
            fontSize: '14px',
            lineHeight: 1.6,
            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
            wordBreak: 'break-word',
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px', animation: 'fadeInUp 0.25s ease' }}>
      {message.tool_used && (
        <div style={{ marginLeft: '40px', marginBottom: '4px' }}>
          <ToolIndicator toolName={message.tool_used} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginRight: '8px',
          marginTop: '2px'
        }}>
          <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
        <div
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '12px 16px',
            borderRadius: '4px 18px 18px 18px',
            maxWidth: '78%',
            fontSize: '14px',
            lineHeight: 1.7,
            boxShadow: 'var(--shadow-sm)',
            wordBreak: 'break-word',
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
          {message.audio && <AudioPlayer audioBase64={message.audio} />}
        </div>
      </div>
    </div>
  );
}
