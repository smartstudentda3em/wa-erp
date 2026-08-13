import { useAuthStore } from '../stores/authStore';

// hook مختصر للتحقق من الصلاحيات داخل المكوّنات
// الاستخدام: const can = useCan();  ثم  can('conversations.assign')
export function useCan() {
  return useAuthStore((s) => s.can);
}

export function useRole() {
  return useAuthStore((s) => s.hasRole);
}
