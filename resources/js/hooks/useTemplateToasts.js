import { useEffect } from 'react';
import { echo } from '../echo';
import api from '../lib/axios';
import { useToastStore } from '../stores/toastStore';

// مستمع عامّ واحد (يُركّب في AppLayout): يشترك في قنوات كل الحسابات
// ويُظهر toast عند تغيّر حالة أي قالب. منفصل عن تحديث المتجر لتفادي تكرار الإشعار.
export function useTemplateToasts() {
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    let channels = [];

    api.get('/whatsapp-accounts').then(({ data }) => {
      channels = (data.data ?? []).map((a) => {
        const channel = echo.private(`whatsapp.account.${a.id}`);
        channel.listen('.template.status', (e) => push(toastFor(e)));
        return channel;
      });
    });

    return () => channels.forEach((c) => c.stopListening('.template.status'));
  }, [push]);
}

function toastFor(e) {
  switch (e.status) {
    case 'approved':
      return { type: 'success', message: `✅ تم اعتماد القالب "${e.name}"` };
    case 'rejected':
      return { type: 'error', message: `⛔ تم رفض القالب "${e.name}"` };
    default:
      return { type: 'warning', message: `🕐 القالب "${e.name}" قيد المراجعة` };
  }
}
