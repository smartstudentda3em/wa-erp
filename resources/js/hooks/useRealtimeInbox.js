import { useEffect } from 'react';
import { echo } from '../echo';
import { useInboxStore } from '../stores/inboxStore';

// يشترك في قناة الحساب ويوجّه الأحداث إلى المتجر
export function useRealtimeInbox(accountId) {
  const onIncoming = useInboxStore((s) => s.onIncomingMessage);
  const onStatus = useInboxStore((s) => s.onStatusUpdate);

  useEffect(() => {
    if (!accountId) return;
    const channel = echo.private(`whatsapp.account.${accountId}`);

    channel.listen('.message.received', onIncoming);
    channel.listen('.message.status', onStatus);

    return () => echo.leave(`whatsapp.account.${accountId}`);
  }, [accountId, onIncoming, onStatus]);
}
