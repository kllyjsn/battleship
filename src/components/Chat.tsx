import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import type { ChatMessage } from '../engine/types';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  playerName: string;
}

export function Chat({ messages, onSend, playerName }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenCountRef = useRef(0);

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Track unread messages only when new messages arrive while chat is closed
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = messages.length;
      setUnread(0);
      return;
    }
    if (messages.length > lastSeenCountRef.current) {
      const newMessages = messages.slice(lastSeenCountRef.current);
      const unreadFromOthers = newMessages.filter(m => m.sender !== playerName).length;
      if (unreadFromOthers > 0) {
        setUnread(prev => prev + unreadFromOthers);
      }
      lastSeenCountRef.current = messages.length;
    }
  }, [messages, isOpen, playerName]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnread(0);
        }}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full metal-panel text-green-400 shadow-lg hover:text-green-300 transition-all flex items-center justify-center z-40"
        style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)' }}
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold font-mono-crt">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 metal-panel rounded-xl shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--steel-border)' }}>
        <span className="text-sm font-semibold text-green-400 font-mono-crt">COMMS</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-green-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-4 font-mono-crt">NO TRANSMISSIONS</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === playerName ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-slate-600 mb-0.5 font-mono-crt">{msg.sender}</span>
            <div
              className={`max-w-[80%] px-3 py-1.5 rounded text-sm font-mono-crt ${
                msg.sender === playerName
                  ? 'metal-panel-light text-green-300/80 rounded-br-sm'
                  : 'text-slate-300 rounded-bl-sm'
              }`}
              style={msg.sender !== playerName ? { background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' } : undefined}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid var(--steel-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Transmit..."
            className="flex-1 px-3 py-2 rounded text-sm placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all font-mono-crt text-green-300"
            style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded metal-panel-light text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
