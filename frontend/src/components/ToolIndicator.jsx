export default function ToolIndicator({ toolName }) {
  if (!toolName) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(124, 58, 237, 0.12)',
        border: '1px solid rgba(124, 58, 237, 0.4)',
        color: 'var(--accent-light)',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        marginBottom: '8px',
      }}
    >
      {toolName}
    </span>
  );
}
