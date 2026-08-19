import { useState } from 'react';
import { useInboxStore } from '../../stores/inboxStore';
import ConversationItem from './ConversationItem';

export default function ConversationList() {
  const { conversations, loadConversations, loading } = useInboxStore();
  const [search, setSearch] = useState('');

  const onSearch = (e) => {
    setSearch(e.target.value);
    loadConversations({ search: e.target.value });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <input
          value={search}
          onChange={onSearch}
          placeholder="بحث بالاسم أو الرقم..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-center text-gray-400 text-sm">جارِ التحميل...</p>}
        {conversations.map((c) => (
          <ConversationItem key={c.id} conversation={c} />
        ))}
        {!loading && conversations.length === 0 && (
          <p className="p-4 text-center text-gray-400 text-sm">لا توجد محادثات</p>
        )}
      </div>
    </div>
  );
}
