import { useInboxStore } from '../../stores/inboxStore';
import Avatar from '../ui/Avatar';

export default function ConversationItem({ conversation }) {
  const { openConversation, activeId } = useInboxStore();
  const active = activeId === conversation.id;
  const name = conversation.customer?.name ?? 'عميل';
  const unread = conversation.unread_count > 0;

  return (
    <button
      onClick={() => openConversation(conversation.id)}
      className={`w-full text-start rounded-xl p-2.5 flex gap-3 items-center transition-colors
        ${active ? 'bg-brand/10' : 'hover:bg-surface-2'}`}
    >
      <Avatar name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <span className={`truncate ${unread ? 'font-bold text-content' : 'font-semibold text-content'}`}>{name}</span>
          <span className="text-[10px] text-muted shrink-0">
            {conversation.last_message_at
              ? new Date(conversation.last_message_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2 mt-0.5">
          <span className={`text-sm truncate ${unread ? 'text-content' : 'text-muted'}`}>
            {conversation.last_preview || '—'}
          </span>
          {unread && (
            <span className="shrink-0 bg-gradient-to-l from-brand to-brand-2 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 grid place-items-center px-1.5">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
