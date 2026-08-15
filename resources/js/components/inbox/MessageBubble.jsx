import MessageStatusTicks from './MessageStatusTicks';

export default function MessageBubble({ message }) {
  const outbound = message.direction === 'outbound';

  return (
    <div className={`flex ${outbound ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 shadow-sm
          ${outbound ? 'bg-green-100' : 'bg-white'}`}
      >
        {message.type === 'image' && message.media_url && (
          <img src={message.media_url} className="rounded-lg mb-1 max-w-full" alt="" />
        )}

        {message.type === 'document' && (
          <a href={message.media_url} target="_blank" rel="noreferrer"
             className="flex items-center gap-2 text-sky-600 mb-1">
            <DocumentIcon className="w-5 h-5" /> مستند
          </a>
        )}

        {message.type === 'template' && !message.body && (
          <span className="text-xs text-gray-500">[قالب]</span>
        )}

        {message.body && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        )}

        <div className="flex items-center gap-1 justify-end mt-1">
          <span className="text-[10px] text-gray-400">
            {new Date(message.created_at).toLocaleTimeString('ar', {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {outbound && <MessageStatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" strokeLinejoin="round" />
    </svg>
  );
}
