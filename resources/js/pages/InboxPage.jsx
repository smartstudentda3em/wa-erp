import { useEffect, useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { useInboxStore } from '../stores/inboxStore';
import { useRealtimeInbox } from '../hooks/useRealtimeInbox';
import api from '../lib/axios';
import ConversationList from '../components/inbox/ConversationList';
import ChatWindow from '../components/inbox/ChatWindow';
import CustomerPanel from '../components/inbox/CustomerPanel';

export default function InboxPage({ accountId: accountIdProp }) {
  const { loadConversations, activeId } = useInboxStore();
  const [accountId, setAccountId] = useState(accountIdProp ?? null);

  useEffect(() => {
    if (accountIdProp) return;
    api.get('/whatsapp-accounts').then(({ data }) => setAccountId(data.data?.[0]?.id ?? null));
  }, [accountIdProp]);

  useRealtimeInbox(accountId);
  useEffect(() => { loadConversations(); }, []);

  return (
    <div className="flex h-full" dir="rtl">
      <aside className="w-80 shrink-0 border-l border-line bg-surface flex flex-col">
        <ConversationList />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-bg">
        {activeId ? <ChatWindow /> : <EmptyState />}
      </main>

      <aside className="w-80 shrink-0 border-r border-line bg-surface hidden xl:flex flex-col overflow-y-auto">
        {activeId && <CustomerPanel />}
      </aside>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 grid place-items-center text-center p-8">
      <div>
        <div className="mx-auto grid place-items-center w-20 h-20 rounded-3xl bg-brand/10 text-brand mb-4">
          <MessagesSquare size={34} />
        </div>
        <p className="text-content font-semibold">اختر محادثة للبدء</p>
        <p className="text-muted text-sm mt-1">حدّد محادثة من القائمة لعرض الرسائل والرد.</p>
      </div>
    </div>
  );
}
