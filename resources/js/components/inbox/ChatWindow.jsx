import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useInboxStore } from '../../stores/inboxStore';
import { useCan } from '../../hooks/useCan';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import TemplatePicker from './TemplatePicker';
import TransferControl from './TransferControl';

const DOT_BG = {
  backgroundImage: 'radial-gradient(rgb(var(--border) / 0.6) 1px, transparent 0)',
  backgroundSize: '22px 22px',
};

export default function ChatWindow() {
  const { messages, activeId, conversations, closeConversation } = useInboxStore();
  const can = useCan();
  const conv = conversations.find((c) => c.id === activeId);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* الترويسة */}
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-surface/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={conv?.customer?.name ?? 'عميل'} />
          <div className="min-w-0">
            <div className="font-semibold text-content truncate">{conv?.customer?.name}</div>
            <div className="text-xs text-muted" dir="ltr">{conv?.customer?.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge ${conv?.window_open ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conv?.window_open ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {conv?.window_open ? 'نافذة مفتوحة' : 'خارج 24 ساعة'}
          </span>
          {can('conversations.assign') && <TransferControl />}
          <button onClick={closeConversation} className="btn-outline btn-sm" title="إغلاق المحادثة">
            <X size={15} /> إغلاق
          </button>
        </div>
      </header>

      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 bg-bg" style={DOT_BG}>
        {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* الكتابة أو القوالب حسب نافذة 24 ساعة */}
      {conv?.window_open ? <Composer /> : <TemplatePicker />}
    </div>
  );
}
