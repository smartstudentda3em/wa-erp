import { useMemo } from 'react';

// حقول العميل المتاحة لربط متغيّرات القالب
const CUSTOMER_FIELDS = [
  { value: 'name', label: 'اسم العميل' },
  { value: 'phone', label: 'رقم الهاتف' },
  { value: 'company_name', label: 'اسم الشركة' },
  { value: 'email', label: 'البريد الإلكتروني' },
];

// يستخرج عدد متغيّرات {{n}} من نص جسم القالب
function extractVariables(template) {
  const body = template?.components?.find(
    (c) => (c.type ?? '').toUpperCase() === 'BODY'
  );
  const text = body?.text ?? '';
  const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  const max = matches.length ? Math.max(...matches) : 0;
  return { count: max, text };
}

// ربط كل {{n}} بحقل من حقول العميل → ينتج map مثل {"1":"name"}
export default function VariableMapper({ template, value, onChange }) {
  const { count, text } = useMemo(() => extractVariables(template), [template]);

  if (!template) return null;
  if (count === 0) {
    return <p className="text-xs text-gray-400">هذا القالب لا يحتوي متغيّرات.</p>;
  }

  const setVar = (index, field) => {
    onChange({ ...value, [index]: field });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs bg-gray-100 rounded-lg p-2 text-gray-600 leading-6">
        <span className="font-semibold">نص القالب:</span> {text}
      </div>

      {Array.from({ length: count }, (_, i) => i + 1).map((index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm font-mono bg-green-100 text-green-700 rounded px-2 py-1">
            {`{{${index}}}`}
          </span>
          <span className="text-gray-400">←</span>
          <select
            value={value[index] ?? ''}
            onChange={(e) => setVar(index, e.target.value)}
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
          >
            <option value="">— اختر الحقل —</option>
            {CUSTOMER_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
