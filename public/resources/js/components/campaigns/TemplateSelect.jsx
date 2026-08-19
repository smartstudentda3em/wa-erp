// اختيار القالب المعتمد ضمن الحساب المحدد
export default function TemplateSelect({ templates, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">القالب المعتمد</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value) || null)}
        className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <option value="">— اختر قالباً —</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.language}) · {t.category}
          </option>
        ))}
      </select>
      {templates.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">لا توجد قوالب معتمدة لهذا الحساب.</p>
      )}
    </div>
  );
}
