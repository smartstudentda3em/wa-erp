import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import StatusDot from './StatusDot';

const OPTIONS = [
  { value: 'available', label: 'متاح', desc: 'تستقبل الرسائل الجديدة' },
  { value: 'away', label: 'بالخارج', desc: 'يتم تخطّيك مؤقتًا' },
  { value: 'offline', label: 'غير متصل', desc: 'لا تستقبل توزيعًا' },
];
const LABEL = { available: 'متاح', away: 'بالخارج', offline: 'غير متصل' };

// قائمة حالة التواجد المنسدلة (نقطة متوهّجة + عنوان) — تؤثّر على استقبال الرسائل
export default function AvailabilityMenu() {
  const availability = useAuthStore((s) => s.user?.availability) ?? 'available';
  const setAvailability = useAuthStore((s) => s.setAvailability);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = async (v) => {
    setOpen(false); setSaving(true);
    try { await setAvailability(v); } catch { /* تجاهل */ } finally { setSaving(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-content hover:bg-surface-2 transition disabled:opacity-60"
      >
        <StatusDot status={availability} />
        <span className="hidden sm:inline">{LABEL[availability]}</span>
        <ChevronDown size={15} className="text-muted" />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-64 card shadow-pop p-1.5 animate-scale-in z-50">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-start transition hover:bg-surface-2 ${o.value === availability ? 'bg-surface-2' : ''}`}
            >
              <StatusDot status={o.value} ring={false} />
              <span className="flex-1">
                <span className="block text-sm font-medium text-content">{o.label}</span>
                <span className="block text-xs text-muted">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
