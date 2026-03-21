import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../utils/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey there! 👋 I\'m your Tomato food assistant. Ask me about restaurants, dishes, or anything food-related!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat', { message: trimmed });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || 'I couldn\'t process that. Please try again!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again in a moment. 🙏',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button — Red/White Tomato Theme */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="chatbot-toggle"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E23744, #d62b38)',
            border: '3px solid #fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(226, 55, 68, 0.45), 0 0 0 4px rgba(226, 55, 68, 0.15)',
            zIndex: 9999,
            transition: 'all 0.3s ease',
            animation: 'chatPulse 2s ease-in-out infinite'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(226, 55, 68, 0.55), 0 0 0 6px rgba(226, 55, 68, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(226, 55, 68, 0.45), 0 0 0 4px rgba(226, 55, 68, 0.15)';
          }}
        >
          <MessageCircle size={28} color="#fff" />
        </button>
      )}

      {/* Chat Panel — Clean Red/White Theme */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 100px)',
            borderRadius: '20px',
            overflow: 'hidden',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(226,55,68,0.15)',
            border: '1px solid #eee',
            animation: 'chatSlideUp 0.3s ease-out'
          }}
        >
          {/* Header — Tomato Red */}
          <div style={{
            background: 'linear-gradient(135deg, #E23744, #d62b38)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <Bot size={22} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                  Tomato AI
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  🟢 Online • Ask me anything
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              id="chatbot-close"
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <X size={18} color="#fff" />
            </button>
          </div>

          {/* Messages — Clean White Background */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E23744, #d62b38)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={14} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #E23744, #d62b38)'
                    : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1f2937',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  border: msg.role === 'assistant'
                    ? '1px solid #e5e7eb'
                    : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  <div style={{
                    fontSize: '10px',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                    marginTop: '4px',
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid #e5e7eb'
                  }}>
                    <User size={14} color="#6b7280" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E23744, #d62b38)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#9ca3af', fontSize: '13px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input — White with Red Accents */}
          <div style={{
            padding: '12px 16px',
            background: '#fff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            flexShrink: 0
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about food, restaurants..."
              id="chatbot-input"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                color: '#1f2937',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#E23744'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              id="chatbot-send"
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #E23744, #d62b38)'
                  : '#f3f4f6',
                border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <Send size={18} color={input.trim() && !isLoading ? '#fff' : '#d1d5db'} />
            </button>
          </div>
        </div>
      )}

      {/* Global styles for animations */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(226, 55, 68, 0.45), 0 0 0 4px rgba(226, 55, 68, 0.15); }
          50% { box-shadow: 0 8px 32px rgba(226, 55, 68, 0.6), 0 0 0 8px rgba(226, 55, 68, 0.1); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
