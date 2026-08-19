import { create } from 'zustand';

let seq = 0;

// متجر إشعارات خفيف مع إزالة تلقائية
export const useToastStore = create((set, get) => ({
  toasts: [],

  push: ({ type = 'info', message, duration = 5000 }) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    if (duration) {
      setTimeout(() => get().remove(id), duration);
    }
    return id;
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
