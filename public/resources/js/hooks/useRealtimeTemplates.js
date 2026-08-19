import { useEffect } from 'react';
import { echo } from '../echo';
import { useTemplateStore } from '../stores/templateStore';

// يستمع لحدث تغيّر حالة القالب على قناة الحساب ويحدّث المتجر لحظياً.
// ملاحظة: لا نستدعي echo.leave حتى لا نُسقط اشتراك الـ Inbox على نفس القناة —
// نكتفي بإيقاف الاستماع لهذا الحدث تحديداً.
export function useRealtimeTemplates(accountId) {
  const upsertStatus = useTemplateStore((s) => s.upsertStatus);

  useEffect(() => {
    if (!accountId) return;
    const channel = echo.private(`whatsapp.account.${accountId}`);
    const handler = (e) => upsertStatus(accountId, e);

    channel.listen('.template.status', handler);
    return () => channel.stopListening('.template.status', handler);
  }, [accountId, upsertStatus]);
}
