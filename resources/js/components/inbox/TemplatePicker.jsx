import { useEffect, useMemo, useState } from 'react';
import { Clock, Eye } from 'lucide-react';
import api from '../../lib/axios';
import { useInboxStore } from '../../stores/inboxStore';
import { useTemplateStore } from '../../stores/templateStore';
import { useRealtimeTemplates } from '../../hooks/useRealtimeTemplates';
import TemplatePreview from '../templates/TemplatePreview';

// يظهر بدل حقل الكتابة عند انتهاء نافذة الـ 24 ساعة.
export default function TemplatePicker() {
  const { activeId, conversations } = useInboxStore();
  const conv = conversations.find((c) => c.id === activeId);
  const accountId = conv?.account?.id;

  const load = useTemplateStore((s) => s.load);
  const rawTemplates = useTemplateStore((s) => s.byAccount[accountId]);
  const templates = useMemo(
    () => (rawTemplates ?? []).filter((t) => t.status === 'approved'),
    [rawTemplates]
  );
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);

  useRealtimeTemplates(accountId);
  useEffect(() => { if (accountId) load(accountId); }, [accountId]);

  const send = async (templateId) => {
    setSending(true);
    try { await api.post(`/conversations/${activeId}/messages/template`, { template_id: templateId }); }
    finally { setSending(false); }
  };

  return (
    <div className="p-3 border-t border-line bg-amber-500/5 shrink-0">
      <p className="text-xs text-amber-500 mb-2 flex items-center gap-1.5">
        <Clock size={14} /> انتهت نافذة الـ 24 ساعة — يمكنك المراسلة عبر قالب معتمد فقط.
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.length === 0 && (
          <span className="text-xs text-muted">لا توجد قوالب معتمدة لهذا الحساب.</span>
        )}
        {templates.map((t) => (
          <div key={t.id} className="flex items-center rounded-xl border border-amber-500/30 bg-surface overflow-hidden">
            <button disabled={sending} onClick={() => send(t.id)}
              className="text-sm px-3 py-1.5 text-content hover:bg-amber-500/10 disabled:opacity-50 transition">
              {t.name}
            </button>
            <button onClick={() => setPreview(t)} title="معاينة"
              className="px-2 py-1.5 text-muted hover:text-content border-e border-amber-500/20 transition">
              <Eye size={15} />
            </button>
          </div>
        ))}
      </div>

      <TemplatePreview template={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
