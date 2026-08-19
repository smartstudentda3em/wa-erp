import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

// علامات التوثيق: pending 🕐 | sent ✓ | delivered/read ✓✓ (read بلون مميّز) | failed ✗
// onLight=true عندما تكون داخل فقاعة متدرّجة بنص أبيض
export default function MessageStatusTicks({ status, onLight = false }) {
  const base = onLight ? 'text-white/70' : 'text-muted';

  if (status === 'pending') return <Clock size={13} className={base} />;
  if (status === 'failed') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] ${onLight ? 'text-rose-200' : 'text-rose-500'}`}>
        <AlertCircle size={13} /> فشل
      </span>
    );
  }

  const read = status === 'read';
  const readCls = onLight ? 'text-sky-200' : 'text-sky-500';

  if (status === 'sent') return <Check size={14} className={base} />;
  return <CheckCheck size={14} className={read ? readCls : base} />;
}
