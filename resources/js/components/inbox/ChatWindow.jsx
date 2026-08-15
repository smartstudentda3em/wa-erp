import { useEffect, useRef } from 'react';
import { useInboxStore } from '../../stores/inboxStore';
import { useCan } from '../../hooks/useCan';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import TemplatePicker from './TemplatePicker';
import TransferControl from './TransferControl';

export default function ChatWindow() {
  const { messages, activeId, conversations, closeConversation } = useInboxStore();
  const can = useCan();
  const conv = conversations.find((c) => c.id === activeId);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* الترويسة */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div>
          <div className="font-medium">{conv?.customer?.name}</div>
          <div className="text-xs text-gray-400">{conv?.customer?.phone}</div>
        </div>
        <div className="flex items-center gap-2">
          {/* زر التحويل: يظهر فقط لمن يملك صلاحية التحويل (admin/manager) */}
          {can('conversations.assign') && <TransferControl />}
          <button
            onClick={closeConversation}
            className="text-xs text-gray-500 border rounded-lg px-3 py-1 hover:bg-gray-50"
          >
            إغلاق المحادثة
          </button>
        </div>
      </header>

      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5]">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* حقل الكتابة أو القوالب حسب نافذة 24 ساعة */}
      {conv?.window_open ? <Composer /> : <TemplatePicker />}
    </div>
  );
}
