import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageCircle, X, ChevronDown, SmilePlus } from 'lucide-react';
import type { ChatMessage } from '../engine/types';

const REACTION_EMOJIS = ['👍', '😂', '🔥', '💀', '🎯', '💣'];

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  playerName: string;
}

export function Chat({ messages, onSend, onReaction, playerName }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to let the panel animate in
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  // Close reaction picker when clicking elsewhere
  useEffect(() => {
    if (!reactionPickerMsgId) return;
    const handleClick = () => setReactionPickerMsgId(null);
    const timer = setTimeout(() => window.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
    };
  }, [reactionPickerMsgId]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onReaction(messageId, emoji);
    setReactionPickerMsgId(null);
  };

  const groupReactions = (reactions: ChatMessage['reactions']) => {
    const grouped: Record<string, string[]> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.sender);
    }
    return grouped;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnread(0);
        }}
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 w-11 h-11 sm:w-12 sm:h-12 rounded-full metal-panel text-green-400 shadow-lg hover:text-green-300 transition-all flex items-center justify-center z-40"
        style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)' }}
      >
        <MessageCircle size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold font-mono-crt animate-pulse">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-80 h-[50vh] sm:h-96 metal-panel sm:rounded-xl shadow-2xl flex flex-col z-40 rounded-t-xl">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 sm:py-3 flex-shrink-0 cursor-pointer sm:cursor-default"
        style={{ borderBottom: '1px solid var(--steel-border)' }}
        onClick={() => setIsOpen(false)}
      >
        <span className="text-sm font-semibold text-green-400 font-mono-crt">COMMS</span>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono-crt">{messages.length} MSG</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="text-slate-500 hover:text-green-400 transition-colors p-0.5"
          >
            <span className="hidden sm:block"><X size={16} /></span>
            <span className="block sm:hidden"><ChevronDown size={18} /></span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
        {messages.length === 0 && (
          <p className="text-center text-slate-600 text-xs sm:text-sm mt-4 font-mono-crt">NO TRANSMISSIONS</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender === playerName;
          const grouped = groupReactions(msg.reactions);
          const hasReactions = Object.keys(grouped).length > 0;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}
            >
              <span className="text-[10px] sm:text-xs text-slate-600 mb-0.5 font-mono-crt">{msg.sender}</span>
              <div className="relative max-w-[85%] sm:max-w-[80%]">
                <div
                  className={`px-2.5 sm:px-3 py-1.5 rounded text-sm font-mono-crt break-words ${
                    isOwn
                      ? 'metal-panel-light text-green-300/80 rounded-br-sm'
                      : 'text-slate-300 rounded-bl-sm'
                  }`}
                  style={!isOwn ? { background: 'var(--hull-dark)', border: '1px solid var(--steel-border)' } : undefined}
                >
                  {msg.message}
                </div>

                {/* Reaction trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id);
                  }}
                  className={`absolute -bottom-1 ${isOwn ? '-left-6' : '-right-6'} w-5 h-5 rounded-full flex items-center justify-center text-slate-600 hover:text-green-400 transition-all opacity-0 group-hover:opacity-100 hover:scale-110`}
                  title="React"
                >
                  <SmilePlus size={12} />
                </button>

                {/* Reaction picker */}
                {reactionPickerMsgId === msg.id && (
                  <div
                    className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'} -top-9 flex gap-0.5 px-1.5 py-1 rounded-lg metal-panel shadow-lg`}
                    style={{ border: '1px solid var(--steel-border)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-green-500/10 transition-colors text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reaction badges */}
              {hasReactions && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(grouped).map(([emoji, senders]) => {
                    const iReacted = senders.includes(playerName);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
                          iReacted
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-slate-800/50 border border-slate-700/50 hover:border-green-500/30'
                        }`}
                        title={senders.join(', ')}
                      >
                        <span>{emoji}</span>
                        {senders.length > 1 && (
                          <span className={`font-mono-crt text-[10px] ${iReacted ? 'text-green-400' : 'text-slate-500'}`}>
                            {senders.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 sm:p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--steel-border)' }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Transmit..."
            className="flex-1 min-w-0 px-3 py-2 rounded text-sm placeholder-slate-600 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all font-mono-crt text-green-300"
            style={{ background: 'var(--hull-dark)', border: '1px solid var(--steel-border)', fontSize: '16px' }}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 p-2 rounded metal-panel-light text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
