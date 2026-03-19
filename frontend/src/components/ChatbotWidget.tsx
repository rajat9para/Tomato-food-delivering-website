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
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="chatbot-toggle"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4)',
            zIndex: 9999,
            transition: 'all 0.3s ease',
            animation: 'chatPulse 2s ease-in-out infinite'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(236, 72, 153, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(236, 72, 153, 0.4)';
          }}
        >
          <MessageCircle size={28} color="#fff" />
        </button>
      )}

      {/* Chat Panel */}
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'chatSlideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
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
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                  🟢 Online • Powered by AI
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              id="chatbot-close"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <X size={18} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#0f0f1a',
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
                    background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
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
                    ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
                    : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  border: msg.role === 'assistant'
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '4px',
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={14} color="#fff" />
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
                  background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: 'rgba(255,255,255,0.6)', fontSize: '13px'
                }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            background: '#13132a',
            borderTop: '1px solid rgba(255,255,255,0.06)',
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
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              id="chatbot-send"
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
                  : 'rgba(255,255,255,0.05)',
                border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <Send size={18} color={input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.3)'} />
            </button>
          </div>
        </div>
      )}

      {/* Global styles for animations */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.4); }
          50% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.6), 0 0 0 8px rgba(236, 72, 153, 0.1); }
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
