import { create } from 'zustand';
import api from '../lib/axios';

// حالة صفحة سجل رسائل الاختبار (فلترة + ترقيم + إعادة إرسال)
export const useTestLogStore = create((set, get) => ({
  logs: [],
  pagination: null,
  filterOptions: { users: [], templates: [] },
  filters: { status: '', user_id: '', template_id: '' },
  stats: null,
  loading: false,

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }));
    get().load(1);
  },

  // معاملات الفلاتر غير الفارغة (تُستخدم في التحميل والتصدير)
  activeParams: () => {
    const { filters } = get();
    const p = {};
    if (filters.status) p.status = filters.status;
    if (filters.user_id) p.user_id = filters.user_id;
    if (filters.template_id) p.template_id = filters.template_id;
    return p;
  },

  loadStats: async () => {
    const { data } = await api.get('/test-log/stats');
    set({ stats: data });
  },

  // تصدير Excel (.xlsx) محترماً الفلاتر الحالية
  exportExcel: async () => {
    const res = await api.get('/test-log/export', {
      params: get().activeParams(),
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-messages-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  load: async (page = 1) => {
    set({ loading: true });
    const params = { page, ...get().activeParams() };

    const { data } = await api.get('/test-log', { params });
    set({
      logs: data.logs.data,
      pagination: {
        current: data.logs.current_page,
        last: data.logs.last_page,
        total: data.logs.total,
      },
      filterOptions: data.filters,
      loading: false,
    });
  },

  resend: async (id) => {
    const { data } = await api.post(`/test-log/${id}/resend`);
    await get().load(get().pagination?.current ?? 1);
    get().loadStats();
    return data.message;
  },
}));
