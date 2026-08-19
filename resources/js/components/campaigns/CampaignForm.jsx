import { useEffect, useMemo, useState } from 'react';
import { useCampaignStore } from '../../stores/campaignStore';
import { useTemplateStore } from '../../stores/templateStore';
import { useRealtimeTemplates } from '../../hooks/useRealtimeTemplates';
import TemplateSelect from './TemplateSelect';
import AudienceSelector from './AudienceSelector';
import VariableMapper from './VariableMapper';
import TemplatePreview from '../templates/TemplatePreview';
import { useToastStore } from '../../stores/toastStore';

const EMPTY = {
  name: '',
  whatsapp_account_id: null,
  message_template_id: null,
  audience_filter: {},
  default_params: {},
  scheduled_at: '',
};

// نموذج إنشاء حملة كامل: القالب + الجمهور + المتغيّرات + الجدولة
export default function CampaignForm({ onCreated }) {
  const {
    accounts, loadAccounts, createCampaign, launchCampaign,
    sampleAudience, testSend, testMessages, loadTestMessages,
  } = useCampaignStore();
  const loadTemplates = useTemplateStore((s) => s.load);
  const pushToast = useToastStore((s) => s.push);

  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sample, setSample] = useState(null);   // أول عميل مستهدف (للمعاينة)
  const [showPreview, setShowPreview] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMedia, setTestMedia] = useState('');
  const [testing, setTesting] = useState(false);

  // القوالب المعتمدة للحساب المحدّد — نختار القائمة الخام ونفلتر عبر useMemo (تفادي حلقة العرض)
  const rawTemplates = useTemplateStore((s) => s.byAccount[form.whatsapp_account_id]);
  const templates = useMemo(
    () => (rawTemplates ?? []).filter((t) => t.status === 'approved'),
    [rawTemplates]
  );
  useRealtimeTemplates(form.whatsapp_account_id);

  useEffect(() => { loadAccounts(); loadTestMessages(); }, []);

  // كشف نوع رأس القالب المحدّد (هل يتطلب وسائط؟)
  const headerFormat = (() => {
    const h = selectedTemplateComponents()?.find((c) => (c.type ?? '').toUpperCase() === 'HEADER');
    return (h?.format ?? 'TEXT').toUpperCase();
  })();
  const needsMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);

  function selectedTemplateComponents() {
    return templates.find((t) => t.id === form.message_template_id)?.components;
  }

  // جلب أول عميل مطابق للفلتر (debounce) لاستخدام بياناته في المعاينة
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      const c = await sampleAudience(form.audience_filter);
      if (active) setSample(c);
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [JSON.stringify(form.audience_filter)]);

  // عند تغيّر الحساب: حمّل قوالبه وصفّر القالب/المتغيّرات
  const onAccountChange = (id) => {
    setForm((f) => ({ ...f, whatsapp_account_id: id, message_template_id: null, default_params: {} }));
    loadTemplates(id);
  };

  const selectedTemplate = templates.find((t) => t.id === form.message_template_id);

  // استبدال متغيّرات القالب بقيَم أول عميل مستهدف: { "1": "أحمد", ... }
  const resolvedValues = Object.fromEntries(
    Object.entries(form.default_params).map(([idx, field]) => [idx, sample?.[field] ?? '']),
  );

  // إرسال رسالة اختبار للرقم المُدخل بقيَم المعاينة نفسها
  const sendTest = async () => {
    if (!form.message_template_id) return pushToast({ type: 'warning', message: 'اختر قالباً أولاً' });
    if (!testPhone.trim()) return pushToast({ type: 'warning', message: 'أدخل رقم هاتف للاختبار' });
    setTesting(true);
    try {
      const msg = await testSend({
        whatsapp_account_id: form.whatsapp_account_id,
        template_id: form.message_template_id,
        to: testPhone.trim(),
        variables: resolvedValues,
        header_media: needsMedia && testMedia.trim() ? testMedia.trim() : undefined,
      });
      pushToast({ type: 'success', message: msg ?? 'تم إرسال رسالة الاختبار.' });
    } catch (e) {
      pushToast({ type: 'error', message: e.response?.data?.message ?? 'فشل إرسال الاختبار.' });
    } finally {
      setTesting(false);
      loadTestMessages(); // حدّث السجل
    }
  };

  const validate = () => {
    if (!form.name.trim()) return 'أدخل اسم الحملة';
    if (!form.whatsapp_account_id) return 'اختر الحساب';
    if (!form.message_template_id) return 'اختر القالب';
    return null;
  };

  const buildPayload = () => ({
    name: form.name,
    whatsapp_account_id: form.whatsapp_account_id,
    message_template_id: form.message_template_id,
    audience_filter: Object.keys(form.audience_filter).length ? form.audience_filter : null,
    default_params: Object.keys(form.default_params).length ? form.default_params : null,
    scheduled_at: form.scheduled_at || null,
  });

  // حفظ فقط (draft/scheduled) أو حفظ + إطلاق فوري
  const submit = async (launchNow) => {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    setSubmitting(true);
    try {
      const campaign = await createCampaign(buildPayload());
      if (launchNow && !form.scheduled_at) {
        await launchCampaign(campaign.id);
      }
      setForm(EMPTY);
      onCreated?.(campaign);
    } catch (e) {
      setError(e.response?.data?.message ?? 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5 max-w-2xl" dir="rtl">
      <h2 className="text-lg font-bold">حملة جديدة</h2>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2">{error}</div>}

      {/* اسم الحملة */}
      <div>
        <label className="block text-sm font-medium mb-1">اسم الحملة</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="عرض نهاية الأسبوع"
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* الحساب */}
      <div>
        <label className="block text-sm font-medium mb-1">حساب واتساب</label>
        <select
          value={form.whatsapp_account_id ?? ''}
          onChange={(e) => onAccountChange(Number(e.target.value) || null)}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">— اختر الحساب —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.label} ({a.display_phone_number})</option>
          ))}
        </select>
      </div>

      {/* القالب */}
      {form.whatsapp_account_id && (
        <TemplateSelect
          templates={templates}
          value={form.message_template_id}
          onChange={(id) => setForm({ ...form, message_template_id: id, default_params: {} })}
        />
      )}

      {/* المتغيّرات */}
      {selectedTemplate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">ربط متغيّرات القالب</label>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="text-xs text-sky-600 hover:underline"
            >
              👁️ معاينة الرسالة
            </button>
          </div>
          <VariableMapper
            template={selectedTemplate}
            value={form.default_params}
            onChange={(params) => setForm({ ...form, default_params: params })}
          />
          {/* سطر معاينة سريع بقيَم واقعية */}
          {sample && (
            <p className="text-[11px] text-gray-400 mt-2">
              ستُعاين الرسالة ببيانات أول عميل مستهدف: <span className="text-green-600">{sample.name}</span>
            </p>
          )}

          {/* إرسال رسالة اختبار قبل الإطلاق */}
          <div className="mt-3 border rounded-xl p-3 bg-gray-50 space-y-2">
            <label className="block text-xs font-medium">رسالة اختبار (تحقّق قبل الإطلاق)</label>

            {/* رابط وسائط الرأس (يظهر فقط للقوالب ذات رأس صورة/فيديو/مستند) */}
            {needsMedia && (
              <div>
                <input
                  value={testMedia}
                  onChange={(e) => setTestMedia(e.target.value)}
                  placeholder={`رابط ${headerFormat === 'IMAGE' ? 'صورة' : headerFormat === 'VIDEO' ? 'فيديو' : 'مستند'} للرأس (https://...)`}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-amber-600 mt-1">
                  هذا القالب يتطلّب وسائط في الرأس — أدخل رابطاً عاماً، وإلا يُستخدم نموذج Meta إن توفّر.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="رقم واتساب E.164: 9665xxxxxxxx"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={sendTest}
                disabled={testing}
                className="bg-sky-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
              >
                {testing ? 'جارِ الإرسال...' : 'إرسال اختبار'}
              </button>
            </div>

            {/* سجلّ رسائل الاختبار الأخيرة */}
            {testMessages.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="text-[11px] font-medium text-gray-500 mb-1">آخر رسائل الاختبار</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {testMessages.slice(0, 8).map((t) => (
                    <li key={t.id} className="text-[11px] flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1">
                        <span className={t.status === 'sent' ? 'text-green-600' : 'text-red-500'}>
                          {t.status === 'sent' ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-600">{t.to}</span>
                        <span className="text-gray-400">· {t.template}</span>
                      </span>
                      <span className="text-gray-400">
                        {t.user} · {new Date(t.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* الجمهور */}
      <AudienceSelector
        value={form.audience_filter}
        onChange={(filter) => setForm({ ...form, audience_filter: filter })}
      />

      {/* الجدولة */}
      <div>
        <label className="block text-sm font-medium mb-1">جدولة الإرسال (اختياري)</label>
        <input
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
          className="w-full rounded-lg border px-3 py-2"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          اترك الحقل فارغاً للإطلاق الفوري، أو حدّد وقتاً للإرسال المجدول تلقائياً.
        </p>
      </div>

      {/* الأزرار */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => submit(true)}
          disabled={submitting}
          className="bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 disabled:opacity-50"
        >
          {form.scheduled_at ? 'حفظ وجدولة' : 'إنشاء وإطلاق الآن'}
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting}
          className="border rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          حفظ كمسودّة
        </button>
      </div>

      {/* معاينة تفاعلية بقيَم واقعية من أول عميل مستهدف */}
      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          values={resolvedValues}
          sampleLabel={sample?.name ? `بيانات ${sample.name}` : null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
