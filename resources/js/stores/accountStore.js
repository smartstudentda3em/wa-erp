import { create } from 'zustand';
import api from '../lib/axios';

// إدارة حسابات واتساب في صفحة الإعدادات (admin فقط)
export const useAccountStore = create((set, get) => ({
  accounts: [],
  loading: false,

  loadAccounts: async () => {
    set({ loading: true });
    const { data } = await api.get('/settings/whatsapp-accounts');
    set({ accounts: data.data, loading: false });
  },

  createAccount: async (payload) => {
    const { data } = await api.post('/settings/whatsapp-accounts', payload);
    set((s) => ({ accounts: [...s.accounts, data.data] }));
    return data.data;
  },

  updateAccount: async (id, payload) => {
    const { data } = await api.put(`/settings/whatsapp-accounts/${id}`, payload);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? data.data : a)) }));
    return data.data;
  },

  // إطلاق مزامنة القوالب من Meta لحساب معيّن
  syncTemplates: async (id) => {
    const { data } = await api.post(`/settings/whatsapp-accounts/${id}/sync-templates`);
    return data.message;
  },
}));
