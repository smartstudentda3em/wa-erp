import { create } from 'zustand';
import api from '../lib/axios';

// متجر موحّد للقوالب مفهرس حسب الحساب — مصدر الحقيقة للمُنتقي والحملة وصفحة القوالب
export const useTemplateStore = create((set, get) => ({
  byAccount: {},   // { [accountId]: Template[] }  (كل الحالات)
  loading: false,

  // تحميل كل قوالب الحساب (بلا فلترة الحالة، لنفلتر في الواجهة)
  load: async (accountId) => {
    if (!accountId) return;
    set({ loading: true });
    const { data } = await api.get('/templates', {
      params: { whatsapp_account_id: accountId, approved_only: false },
    });
    set((s) => ({
      byAccount: { ...s.byAccount, [accountId]: data.data },
      loading: false,
    }));
  },

  // قراءة قوالب حساب (اختياريّاً المعتمدة فقط)
  get: (accountId, approvedOnly = false) => {
    const list = get().byAccount[accountId] ?? [];
    return approvedOnly ? list.filter((t) => t.status === 'approved') : list;
  },

  // تحديث حالة قالب لحظياً من حدث Reverb (أو إضافته إن كان جديداً)
  upsertStatus: (accountId, e) => set((s) => {
    const list = s.byAccount[accountId] ?? [];
    const idx = list.findIndex(
      (t) => t.id === e.id || (t.name === e.name && t.language === e.language)
    );

    let next;
    if (idx > -1) {
      next = [...list];
      next[idx] = { ...next[idx], status: e.status };
    } else {
      next = [...list, {
        id: e.id, name: e.name, language: e.language,
        status: e.status, category: null, components: [],
      }];
    }
    return { byAccount: { ...s.byAccount, [accountId]: next } };
  }),
}));
