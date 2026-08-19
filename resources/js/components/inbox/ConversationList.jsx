import { useState } from 'react';
import { Search } from 'lucide-react';
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
      <div className="p-4 border-b border-line">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-content">المحادثات</h2>
          <span className="badge bg-brand/10 text-brand">{conversations.length}</span>
        </div>
        <div className="relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={onSearch}
            placeholder="بحث بالاسم أو الرقم..."
            className="w-full rounded-xl border border-line bg-surface-2/60 ps-9 pe-3 py-2 text-sm text-content placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-surface transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && <p className="p-4 text-center text-muted text-sm">جارِ التحميل...</p>}
        {conversations.map((c) => <ConversationItem key={c.id} conversation={c} />)}
        {!loading && conversations.length === 0 && (
          <p className="p-6 text-center text-muted text-sm">لا توجد محادثات</p>
        )}
      </div>
    </div>
  );
}
