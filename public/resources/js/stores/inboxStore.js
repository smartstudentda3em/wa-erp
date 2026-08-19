import { create } from 'zustand';
import api from '../lib/axios';

// المتجر المركزي للـ Inbox — كل التحديثات اللحظية تمرّ من هنا
export const useInboxStore = create((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  loading: false,

  loadConversations: async (params = {}) => {
    set({ loading: true });
    const { data } = await api.get('/conversations', { params });
    set({ conversations: data.data, loading: false });
  },

  openConversation: async (id) => {
    set({ activeId: id });
    const { data } = await api.get(`/conversations/${id}`);
    set({ messages: data.messages.data ?? data.messages });
    api.post(`/conversations/${id}/read`);
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, unread_count: 0 } : c),
    }));
  },

  sendText: async (body) => {
    const id = get().activeId;
    const { data } = await api.post(`/conversations/${id}/messages`, { body });
    set((s) => ({ messages: [...s.messages, data.data] }));
  },

  sendMedia: async (file, caption) => {
    const id = get().activeId;
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    const { data } = await api.post(`/conversations/${id}/messages/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    set((s) => ({ messages: [...s.messages, data.data] }));
  },

  closeConversation: async () => {
    const id = get().activeId;
    await api.post(`/conversations/${id}/close`);
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, status: 'closed' } : c),
    }));
  },

  // قائمة الموظفين (للتحويل)
  agents: [],
  loadAgents: async () => {
    const { data } = await api.get('/users', { params: { role: 'agent_or_manager' } });
    set({ agents: data.data ?? data });
  },

  assignConversation: async (userId) => {
    const id = get().activeId;
    await api.post(`/conversations/${id}/assign`, { assigned_to: userId });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, assigned_to: { id: userId } } : c),
    }));
  },

  // ===== تُستدعى من الـ realtime hook =====
  onIncomingMessage: (e) => set((s) => {
    const isActive = s.activeId === e.conversation_id;
    const messages = isActive ? [...s.messages, e.message] : s.messages;

    const idx = s.conversations.findIndex((c) => c.id === e.conversation_id);
    let conversations = [...s.conversations];
    if (idx > -1) {
      const conv = {
        ...conversations[idx],
        last_preview: e.conversation.last_message_preview,
        unread_count: isActive ? 0 : e.conversation.unread_count,
        last_message_at: e.message.created_at,
      };
      conversations.splice(idx, 1);
      conversations.unshift(conv);
    }
    return { messages, conversations };
  }),

  onStatusUpdate: (e) => set((s) => ({
    messages: s.messages.map((m) =>
      m.id === e.message_id ? { ...m, status: e.status } : m),
  })),
}));
