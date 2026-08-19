import { X, Link2, Phone, MessageSquare } from 'lucide-react';

// معاينة قالب بشكل فقاعة واتساب (المعاينة تحاكي هاتف واتساب فتبقى فاتحة دائمًا)
export default function TemplatePreview({ template, onClose, values = null, sampleLabel = null }) {
  if (!template) return null;

  const comps = template.components ?? [];
  const find = (type) => comps.find((c) => (c.type ?? '').toUpperCase() === type);
  const header = find('HEADER');
  const body = find('BODY');
  const footer = find('FOOTER');
  const buttons = find('BUTTONS')?.buttons ?? [];

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 grid place-items-center p-4 animate-fade-in" onClick={onClose} dir="rtl">
      <div className="card shadow-pop w-full max-w-sm overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-3 border-b border-line">
          <h3 className="font-bold text-sm text-content">{template.name}</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        {/* الفقاعة (محاكاة واتساب) */}
        <div className="p-4 bg-[#e5ddd5]">
          <div className="bg-white rounded-2xl shadow-sm p-3 max-w-[85%] text-slate-800">
            {header && <HeaderView header={header} values={values} />}
            {body?.text && <p className="text-sm whitespace-pre-wrap leading-6">{renderTokens(body.text, values)}</p>}
            {footer?.text && <p className="text-[11px] text-slate-400 mt-1">{footer.text}</p>}
          </div>

          {buttons.length > 0 && (
            <div className="mt-2 space-y-1">
              {buttons.map((b, i) => (
                <div key={i} className="bg-white rounded-lg text-center text-sky-600 text-sm py-2 shadow-sm flex items-center justify-center gap-1.5">
                  <ButtonIcon type={b.type} />{b.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 text-xs text-muted border-t border-line flex justify-between">
          <span>{template.language} · {template.category ?? '—'}</span>
          {sampleLabel && <span className="text-brand">معاينة بـ{sampleLabel}</span>}
        </div>
      </div>
    </div>
  );
}

function HeaderView({ header, values }) {
  const format = (header.format ?? 'TEXT').toUpperCase();
  if (format === 'TEXT') return <p className="font-semibold text-sm mb-1">{renderTokens(header.text, values)}</p>;
  const label = { IMAGE: '🖼️ صورة', VIDEO: '🎬 فيديو', DOCUMENT: '📄 مستند' }[format] ?? format;
  return <div className="bg-slate-100 rounded-lg h-24 flex items-center justify-center text-slate-400 text-sm mb-2">{label}</div>;
}

function renderTokens(text, values) {
  const parts = String(text ?? '').split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(\d+)\}\}$/);
    if (!m) return <span key={i}>{part}</span>;
    const value = values?.[m[1]];
    if (value !== undefined && value !== null && value !== '') {
      return <span key={i} className="text-emerald-700 font-medium">{value}</span>;
    }
    return <span key={i} className="bg-emerald-100 text-emerald-700 rounded px-1 mx-0.5 text-xs font-mono">{part}</span>;
  });
}

function ButtonIcon({ type }) {
  const t = (type ?? '').toUpperCase();
  if (t === 'URL') return <Link2 size={14} />;
  if (t === 'PHONE_NUMBER') return <Phone size={14} />;
  return <MessageSquare size={14} />;
}
