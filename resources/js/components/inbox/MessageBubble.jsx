import { FileText } from 'lucide-react';
import MessageStatusTicks from './MessageStatusTicks';

export default function MessageBubble({ message }) {
  const outbound = message.direction === 'outbound';

  return (
    <div className={`flex ${outbound ? 'justify-start' : 'justify-end'} mb-2 animate-fade-in`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-soft
          ${outbound
            ? 'bg-gradient-to-br from-brand to-brand-2 text-white rounded-tr-md'
            : 'bg-surface border border-line text-content rounded-tl-md'}`}
      >
        {message.type === 'image' && message.media_url && (
          <img src={message.media_url} className="rounded-lg mb-1 max-w-full" alt="" />
        )}

        {message.type === 'document' && (
          <a href={message.media_url} target="_blank" rel="noreferrer"
             className={`flex items-center gap-2 mb-1 ${outbound ? 'text-white/90' : 'text-brand'}`}>
            <FileText size={16} /> مستند
          </a>
        )}

        {message.type === 'template' && !message.body && (
          <span className={`text-xs ${outbound ? 'text-white/70' : 'text-muted'}`}>[قالب]</span>
        )}

        {message.body && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>}

        <div className="flex items-center gap-1 justify-end mt-1">
          <span className={`text-[10px] ${outbound ? 'text-white/70' : 'text-muted'}`}>
            {new Date(message.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {outbound && <MessageStatusTicks status={message.status} onLight />}
        </div>
      </div>
    </div>
  );
}
