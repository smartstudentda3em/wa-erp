import { useEffect, useState } from 'react';
import { useInboxStore } from '../../stores/inboxStore';

// زر تحويل المحادثة لموظف آخر — يُعرض فقط لمن يملك صلاحية conversations.assign
export default function TransferControl() {
  const { agents, loadAgents, assignConversation } = useInboxStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && agents.length === 0) loadAgents();
  }, [open]);

  const transfer = async (userId) => {
    await assignConversation(userId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-600 border rounded-lg px-3 py-1 hover:bg-gray-50"
      >
        تحويل ▾
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {agents.length === 0 && (
            <p className="p-2 text-xs text-gray-400">جارِ التحميل...</p>
          )}
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => transfer(a.id)}
              className="w-full text-right px-3 py-2 text-sm hover:bg-green-50"
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
