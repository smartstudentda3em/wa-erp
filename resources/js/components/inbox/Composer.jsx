import { useRef, useState } from 'react';
import { useInboxStore } from '../../stores/inboxStore';

export default function Composer() {
  const { sendText, sendMedia } = useInboxStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendText(text);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSending(true);
      try {
        await sendMedia(file, '');
      } finally {
        setSending(false);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t bg-white">
      <input
        type="file"
        ref={fileRef}
        onChange={onFile}
        hidden
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,video/*"
      />
      <button
        onClick={() => fileRef.current.click()}
        className="text-gray-500 hover:text-green-600 p-2"
        title="إرفاق ملف"
      >
        <PaperclipIcon className="w-6 h-6" />
      </button>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="اكتب رسالة..."
        className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      <button
        onClick={submit}
        disabled={sending}
        className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 disabled:opacity-50"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

function PaperclipIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5l-8.5 8.5a5 5 0 01-7-7l8.5-8.5a3 3 0 014 4L9 16.5a1 1 0 01-1.5-1.5L15 7"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  );
}
