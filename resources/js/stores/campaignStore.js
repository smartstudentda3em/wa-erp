import { create } from 'zustand';
import api from '../lib/axios';

// حالة قائمة الحملات + إنشاء حملة جديدة
export const useCampaignStore = create((set, get) => ({
  campaigns: [],
  accounts: [],
  loading: false,

  loadCampaigns: async () => {
    set({ loading: true });
    const { data } = await api.get('/campaigns');
    set({ campaigns: data.data, loading: false });
  },

  loadAccounts: async () => {
    const { data } = await api.get('/whatsapp-accounts');
    set({ accounts: data.data });
  },

  // ملاحظة: القوالب تُدار عبر templateStore (مصدر موحّد + تحديث لحظي)

  // معاينة عدد الجمهور من الفلتر (قبل الإنشاء)
  previewAudience: async (audienceFilter) => {
    const { data } = await api.post('/audience/preview', { audience_filter: audienceFilter });
    return data.audience_count;
  },

  // أول عميل مطابق للفلتر (لمعاينة واقعية للرسالة)
  sampleAudience: async (audienceFilter) => {
    const { data } = await api.post('/audience/sample', { audience_filter: audienceFilter });
    return data.customer; // { name, phone, company_name, email } أو null
  },

  // إرسال رسالة اختبار لرقم محدّد
  testSend: async (payload) => {
    const { data } = await api.post('/campaigns/test-send', payload);
    return data.message;
  },

  // سجلّ رسائل الاختبار الأخيرة
  testMessages: [],
  loadTestMessages: async () => {
    const { data } = await api.get('/campaigns/test-messages');
    set({ testMessages: data.data });
  },

  // إنشاء الحملة (draft أو scheduled حسب وجود scheduled_at)
  createCampaign: async (payload) => {
    const { data } = await api.post('/campaigns', payload);
    set((s) => ({ campaigns: [data.data, ...s.campaigns] }));
    return data.data;
  },

  launchCampaign: async (id) => {
    await api.post(`/campaigns/${id}/launch`);
  },
}));
