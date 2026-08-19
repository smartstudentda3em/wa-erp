import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useInboxStore } from '../../stores/inboxStore';
import { useTemplateStore } from '../../stores/templateStore';
import { useRealtimeTemplates } from '../../hooks/useRealtimeTemplates';
import TemplatePreview from '../templates/TemplatePreview';

// يظهر بدل حقل الكتابة عند انتهاء نافذة الـ 24 ساعة.
// القوالب تُقرأ من المتجر الموحّد وتتحدّث حالتها لحظياً عبر Reverb.
export default function TemplatePicker() {
  const { activeId, conversations } = useInboxStore();
  const conv = conversations.find((c) => c.id === activeId);
  const accountId = conv?.account?.id;

  const load = useTemplateStore((s) => s.load);
  const templates = useTemplateStore((s) => s.get(accountId, true)); // المعتمدة فقط
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);

  useRealtimeTemplates(accountId); // تحديث لحظي للحالات

  useEffect(() => {
    if (accountId) load(accountId);
  }, [accountId]);

  const send = async (templateId) => {
    setSending(true);
    try {
      await api.post(`/conversations/${activeId}/messages/template`, { template_id: templateId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 border-t bg-amber-50">
      <p className="text-xs text-amber-700 mb-2">
        ⏰ انتهت نافذة الـ 24 ساعة — يمكنك المراسلة عبر قالب معتمد فقط.
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.length === 0 && (
          <span className="text-xs text-gray-400">لا توجد قوالب معتمدة لهذا الحساب.</span>
        )}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center border border-amber-300 bg-white rounded-lg overflow-hidden">
            <button
              disabled={sending}
              onClick={() => send(t.id)}
              className="text-sm px-3 py-1.5 hover:bg-amber-100 disabled:opacity-50"
            >
              {t.name}
            </button>
            <button
              onClick={() => setPreview(t)}
              title="معاينة"
              className="px-2 py-1.5 text-gray-400 hover:text-gray-600 border-r border-amber-200"
            >
              👁️
            </button>
          </div>
        ))}
      </div>

      <TemplatePreview template={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
