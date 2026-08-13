import { useInboxStore } from '../../stores/inboxStore';

export default function ConversationItem({ conversation }) {
  const { openConversation, activeId } = useInboxStore();
  const active = activeId === conversation.id;
  const name = conversation.customer?.name ?? 'عميل';

  return (
    <button
      onClick={() => openConversation(conversation.id)}
      className={`w-full text-right p-3 border-b hover:bg-gray-50 flex gap-3 items-center
        ${active ? 'bg-green-50' : ''}`}
    >
      <Avatar name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{name}</span>
          <span className="text-[10px] text-gray-400">
            {conversation.last_message_at
              ? new Date(conversation.last_message_at).toLocaleTimeString('ar', {
                  hour: '2-digit', minute: '2-digit',
                })
              : ''}
          </span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-sm text-gray-500 truncate">{conversation.last_preview}</span>
          {conversation.unread_count > 0 && (
            <span className="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Avatar({ name }) {
  const letter = (name ?? '؟').charAt(0);
  return (
    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
      {letter}
    </div>
  );
}
