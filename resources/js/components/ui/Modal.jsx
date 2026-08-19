import { useEffect } from 'react';
import { X } from 'lucide-react';

// نافذة منبثقة أنيقة: خلفية ضبابية + دخول ناعم + إغلاق بـ Esc/النقر خارجها
export default function Modal({ open, onClose, title, subtitle, icon, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const w = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${w} card shadow-pop animate-scale-in flex flex-col max-h-[90vh]`}>
        <div className="flex items-start gap-3 px-5 py-4 border-b border-line">
          {icon && <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-content leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="إغلاق"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex gap-3 justify-start px-5 py-4 border-t border-line bg-surface-2/40 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
