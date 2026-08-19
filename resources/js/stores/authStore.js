import { create } from 'zustand';
import api from '../lib/axios';

// حالة المستخدم الحالي + مساعدات التحقق من الصلاحيات/الأدوار
export const useAuthStore = create((set, get) => ({
  user: null,
  loaded: false,

  loadMe: async () => {
    try {
      const { data } = await api.get('/me');
      set({ user: data, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },

  // هل يملك المستخدم صلاحية معيّنة؟
  can: (permission) => get().user?.permissions?.includes(permission) ?? false,

  // هل ينتمي لدور معيّن؟
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,

  // تحديث حالة تواجد المستخدم الحالي (متاح/بالخارج/غير متصل)
  setAvailability: async (availability) => {
    const { data } = await api.patch('/me/availability', { availability });
    set((s) => ({ user: { ...s.user, availability: data.availability } }));
  },

  reset: () => set({ user: null, loaded: false }),
}));
