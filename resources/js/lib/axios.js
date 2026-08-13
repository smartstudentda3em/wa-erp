import axios from 'axios';

// Sanctum SPA: إرسال كوكيز الجلسة مع كل طلب
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

// يجب طلب csrf-cookie مرة قبل تسجيل الدخول
export async function initCsrf() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

export default api;
