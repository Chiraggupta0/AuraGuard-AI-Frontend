import { useEffect, useRef, useState } from 'react';
import { FiX, FiSend } from 'react-icons/fi';

export default function ChatPanel({ isOpen, onClose, messages = [], onSendMessage }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to the latest message whenever the list grows or the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage?.(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex lg:static lg:z-auto lg:w-80 xl:w-96 lg:flex-shrink-0">
      {/* Mobile-only backdrop — chat behaves as a full drawer on small screens */}
      <div className="absolute inset-0 bg-slate-950/60 lg:hidden" onClick={onClose} />

      <div className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900 lg:w-full lg:max-w-none">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 p-4">
          <h2 className="font-semibold text-slate-100">Chat</h2>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-100"
            aria-label="Close chat"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-slate-500">
                No messages yet. Say hello to start the conversation.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
                <span className="mb-1 px-1 text-xs font-medium text-slate-500">
                  {msg.isLocal ? 'You' : msg.senderName}
                </span>
                <div
                  className={`max-w-[85%] break-words rounded-lg px-3 py-2 text-sm ${
                    msg.isLocal ? 'bg-auraguard-500 text-white' : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-800 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950/50 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-auraguard-500 focus:outline-none focus:ring-2 focus:ring-auraguard-500/20"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-auraguard-500 text-white transition-colors hover:bg-auraguard-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
