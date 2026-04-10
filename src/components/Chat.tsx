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
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition-all flex items-center justify-center z-40"
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-slate-900/95 border border-purple-900/40 rounded-2xl shadow-2xl flex flex-col z-40 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-sm font-semibold text-purple-300">Chat</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-sm mt-4">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === playerName ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-slate-500 mb-0.5">{msg.sender}</span>
            <div
              className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                msg.sender === playerName
                  ? 'bg-purple-600/60 text-white rounded-br-sm'
                  : 'bg-slate-800/80 text-slate-200 rounded-bl-sm'
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-white text-sm placeholder-slate-500 focus:border-purple-500/60 focus:outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
