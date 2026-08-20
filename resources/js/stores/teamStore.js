import { create } from 'zustand';
import api from '../lib/axios';

// إدارة الأقسام وفريق المبيعات (admin) + قائمة الأقسام لاستخدامها في نماذج أخرى
export const useTeamStore = create((set, get) => ({
  departments: [],
  members: [],
  loading: false,

  // تحميل الأقسام + كل الموظفين (شامل المعطّلين) لصفحة الإدارة
  loadAll: async () => {
    set({ loading: true });
    try {
      const [dep, mem] = await Promise.all([
        api.get('/departments'),
        api.get('/users', { params: { include_inactive: 1 } }),
      ]);
      set({ departments: dep.data.data, members: mem.data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // تحميل الأقسام فقط (لقوائم الاختيار في صفحات أخرى)
  loadDepartments: async () => {
    const { data } = await api.get('/departments');
    set({ departments: data.data });
    return data.data;
  },

  saveDepartment: async (payload, id) => {
    const { data } = id
      ? await api.put(`/departments/${id}`, payload)
      : await api.post('/departments', payload);
    await get().loadAll();
    return data.data;
  },

  saveMember: async (payload, id) => {
    const { data } = id
      ? await api.put(`/users/${id}`, payload)
      : await api.post('/users', payload);
    await get().loadAll();
    return data.data;
  },

  deleteDepartment: async (id) => {
    await api.delete(`/departments/${id}`);
    await get().loadAll();
  },

  deleteMember: async (id) => {
    await api.delete(`/users/${id}`);
    await get().loadAll();
  },
}));
