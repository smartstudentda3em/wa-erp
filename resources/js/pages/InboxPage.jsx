import { useEffect, useState } from 'react';
import { useInboxStore } from '../stores/inboxStore';
import { useRealtimeInbox } from '../hooks/useRealtimeInbox';
import api from '../lib/axios';
import ConversationList from '../components/inbox/ConversationList';
import ChatWindow from '../components/inbox/ChatWindow';
import CustomerPanel from '../components/inbox/CustomerPanel';

export default function InboxPage({ accountId: accountIdProp }) {
  const { loadConversations, activeId } = useInboxStore();
  const [accountId, setAccountId] = useState(accountIdProp ?? null);

  // حلّ الحساب النشط ذاتياً (أول حساب) إن لم يُمرَّر
  useEffect(() => {
    if (accountIdProp) return;
    api.get('/whatsapp-accounts').then(({ data }) => {
      setAccountId(data.data?.[0]?.id ?? null);
    });
  }, [accountIdProp]);

  useRealtimeInbox(accountId);

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      <aside className="w-80 border-l bg-white flex flex-col">
        <ConversationList />
      </aside>

      <main className="flex-1 flex flex-col">
        {activeId ? <ChatWindow /> : <EmptyState />}
      </main>

      <aside className="w-80 border-r bg-white hidden lg:block overflow-y-auto">
        {activeId && <CustomerPanel />}
      </aside>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      اختر محادثة للبدء
    </div>
  );
}
