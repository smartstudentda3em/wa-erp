// معاينة قالب بشكل فقاعة واتساب: Header + Body + Footer + Buttons
// values (اختياري): خريطة { "1": "أحمد", ... } لاستبدال المتغيّرات بقيَم واقعية
// sampleLabel (اختياري): وصف مصدر القيم (مثل: بيانات "أحمد")
export default function TemplatePreview({ template, onClose, values = null, sampleLabel = null }) {
  if (!template) return null;

  const comps = template.components ?? [];
  const find = (type) => comps.find((c) => (c.type ?? '').toUpperCase() === type);

  const header = find('HEADER');
  const body = find('BODY');
  const footer = find('FOOTER');
  const buttonsComp = find('BUTTONS');
  const buttons = buttonsComp?.buttons ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-sm">{template.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* الفقاعة */}
        <div className="p-4 bg-[#e5ddd5] rounded-b-none">
          <div className="bg-white rounded-2xl shadow-sm p-3 max-w-[85%]">
            {header && <HeaderView header={header} values={values} />}
            {body?.text && <BodyText text={body.text} values={values} />}
            {footer?.text && <p className="text-[11px] text-gray-400 mt-1">{footer.text}</p>}
          </div>

          {/* الأزرار */}
          {buttons.length > 0 && (
            <div className="mt-2 space-y-1">
              {buttons.map((b, i) => (
                <div key={i} className="bg-white rounded-lg text-center text-sky-600 text-sm py-2 shadow-sm flex items-center justify-center gap-1">
                  <ButtonIcon type={b.type} />
                  {b.text}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 text-xs text-gray-400 border-t flex justify-between">
          <span>{template.language} · {template.category ?? '—'}</span>
          {sampleLabel && <span className="text-green-600">معاينة بـ{sampleLabel}</span>}
        </div>
      </div>
    </div>
  );
}

function HeaderView({ header, values }) {
  const format = (header.format ?? 'TEXT').toUpperCase();
  if (format === 'TEXT') {
    return <p className="font-semibold text-sm mb-1">{renderTokens(header.text, values)}</p>;
  }
  const label = { IMAGE: '🖼️ صورة', VIDEO: '🎬 فيديو', DOCUMENT: '📄 مستند' }[format] ?? format;
  return (
    <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-gray-400 text-sm mb-2">
      {label}
    </div>
  );
}

// يعرض نص الجسم: يستبدل {{n}} بالقيمة الواقعية إن وُجدت، وإلا يُبرزها كشريحة
function BodyText({ text, values }) {
  return <p className="text-sm whitespace-pre-wrap leading-6">{renderTokens(text, values)}</p>;
}

// أداة مشتركة: تحويل نص فيه {{n}} إلى عناصر React (قيمة واقعية أو شريحة placeholder)
function renderTokens(text, values) {
  const parts = String(text ?? '').split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(\d+)\}\}$/);
    if (!m) return <span key={i}>{part}</span>;

    const value = values?.[m[1]];
    if (value !== undefined && value !== null && value !== '') {
      // قيمة واقعية مستبدَلة
      return <span key={i} className="text-green-700 font-medium">{value}</span>;
    }
    // لا قيمة → أبرِز المتغيّر
    return (
      <span key={i} className="bg-green-100 text-green-700 rounded px-1 mx-0.5 text-xs font-mono">
        {part}
      </span>
    );
  });
}

function ButtonIcon({ type }) {
  const t = (type ?? '').toUpperCase();
  if (t === 'URL') return <span>🔗</span>;
  if (t === 'PHONE_NUMBER') return <span>📞</span>;
  return <span>💬</span>; // QUICK_REPLY
}
