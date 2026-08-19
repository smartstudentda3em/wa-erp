import { useEffect, useState } from 'react';
import { useCampaignStore } from '../../stores/campaignStore';

// اختيار الجمهور المستهدف (وسوم + مصدر) مع معاينة العدد لحظياً
export default function AudienceSelector({ value, onChange }) {
  const previewAudience = useCampaignStore((s) => s.previewAudience);
  const [tagsInput, setTagsInput] = useState((value.tags ?? []).join('، '));
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);

  // معاينة العدد عند تغيّر الفلتر (debounce بسيط)
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setCount(await previewAudience(value));
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [JSON.stringify(value)]);

  const updateTags = (raw) => {
    setTagsInput(raw);
    const tags = raw.split(/[،,]/).map((t) => t.trim()).filter(Boolean);
    onChange({ ...value, tags: tags.length ? tags : undefined });
  };

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">الجمهور المستهدف</label>
        <span className="text-xs">
          {loading ? '...' : (
            <span className="text-green-700 font-semibold">
              {count ?? 0} عميل
            </span>
          )}
        </span>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">الوسوم (افصل بفاصلة)</label>
        <input
          value={tagsInput}
          onChange={(e) => updateTags(e.target.value)}
          placeholder="VIP، جديد"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">المصدر</label>
        <input
          value={value.source ?? ''}
          onChange={(e) => onChange({ ...value, source: e.target.value || undefined })}
          placeholder="whatsapp / معرض / ..."
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <p className="text-[11px] text-gray-400">
        اترك الحقول فارغة لاستهداف جميع العملاء الذين لديهم رقم واتساب.
      </p>
    </div>
  );
}
