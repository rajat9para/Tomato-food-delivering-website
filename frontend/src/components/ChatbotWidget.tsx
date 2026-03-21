import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Mic, MicOff, Star, IndianRupee } from 'lucide-react';
import api from '../utils/api';

interface FoodResult {
  _id: string;
  name: string;
  price: number;
  discount: number;
  category: string;
  images: string[];
  description: string;
  restaurant: { name: string; rating: number; imageUrl?: string };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  foods?: FoodResult[];
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey there! 👋 I\'m your Tomato AI assistant. Ask me about dishes, restaurants, or anything food-related!\n\nTry: "Show me gulab jamun" or "What does [restaurant] serve?"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'discount'>('rating');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Web Speech API for voice input
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Try Chrome!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto-send after voice input
      setTimeout(() => {
        sendMessageWithText(transcript);
      }, 300);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const sendMessageWithText = async (text: string) => {
    const trimmed = text.trim();
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
      const { response: aiText, foods } = response.data;
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText || 'I couldn\'t process that. Please try again!',
        timestamp: new Date(),
        foods: foods || []
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

  const sendMessage = async () => {
    await sendMessageWithText(input);
  };

  const sortFoods = (foods: FoodResult[]) => {
    return [...foods].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
      return (b.restaurant.rating || 0) - (a.restaurant.rating || 0);
    });
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return Math.round(price * (1 - discount / 100));
  };

  const getImageUrl = (img: string) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    return `${base}${img}`;
  };

  return (
    <>
      {/* Floating Toggle Button */}
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
          <MessageCircle size={26} color="#fff" />
        </button>
      )}

      {/* Slide-in Panel from Right */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)', zIndex: 9998,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '420px',
              maxWidth: '100vw',
              height: '100vh',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              borderLeft: '3px solid #E23744',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #E23744, #d62b38)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em' }}>
                    Tomato AI Assistant
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600 }}>
                    🟢 Online • Powered by AI + Database
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                id="chatbot-close"
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <X size={20} color="#fff" />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {messages.map(msg => (
                <div key={msg.id}>
                  {/* Message bubble */}
                  <div style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #E23744, #d62b38)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '2px'
                      }}>
                        <Bot size={14} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '80%',
                      padding: '11px 15px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #E23744, #d62b38)' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#1f2937',
                      fontSize: '13.5px', lineHeight: '1.6',
                      wordBreak: 'break-word',
                      border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                  </div>

                  {/* Rich Food Cards — shown below assistant messages */}
                  {msg.role === 'assistant' && msg.foods && msg.foods.length > 0 && (
                    <div style={{ marginTop: '10px', marginLeft: '38px' }}>
                      {/* Sort controls */}
                      <div style={{
                        display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap'
                      }}>
                        {(['rating', 'price', 'discount'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            style={{
                              padding: '4px 10px', borderRadius: '8px',
                              fontSize: '10px', fontWeight: 700, border: 'none',
                              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                              background: sortBy === s ? '#E23744' : '#f3f4f6',
                              color: sortBy === s ? '#fff' : '#6b7280',
                              transition: 'all 0.2s'
                            }}
                          >
                            {s === 'rating' ? '⭐ Rating' : s === 'price' ? '💰 Price' : '🏷️ Discount'}
                          </button>
                        ))}
                      </div>

                      {/* Dish cards */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        maxHeight: '320px', overflowY: 'auto'
                      }}>
                        {sortFoods(msg.foods).map(food => (
                          <div key={food._id} style={{
                            display: 'flex', gap: '10px', padding: '10px',
                            background: '#fff', borderRadius: '14px',
                            border: '1px solid #e5e7eb', cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                          }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#E23744';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(226,55,68,0.12)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                            }}
                          >
                            {/* Food Image */}
                            <div style={{
                              width: '70px', height: '70px', borderRadius: '10px',
                              overflow: 'hidden', flexShrink: 0, background: '#f3f4f6'
                            }}>
                              {food.images?.[0] ? (
                                <img
                                  src={getImageUrl(food.images[0])}
                                  alt={food.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%', height: '100%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                                  color: '#E23744', fontWeight: 800, fontSize: '20px'
                                }}>
                                  {food.name.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Food Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '13px', fontWeight: 700, color: '#1f2937',
                                marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {food.name}
                              </div>
                              <div style={{
                                fontSize: '11px', color: '#9ca3af', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px'
                              }}>
                                {food.restaurant.name}
                                {food.restaurant.rating > 0 && (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '2px',
                                    background: '#f0fdf4', color: '#16a34a',
                                    padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700
                                  }}>
                                    <Star size={9} fill="#16a34a" /> {food.restaurant.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '14px', fontWeight: 800, color: '#E23744',
                                  display: 'flex', alignItems: 'center'
                                }}>
                                  <IndianRupee size={12} />
                                  {food.discount > 0 ? getDiscountedPrice(food.price, food.discount) : food.price}
                                </span>
                                {food.discount > 0 && (
                                  <>
                                    <span style={{
                                      fontSize: '11px', color: '#d1d5db', textDecoration: 'line-through'
                                    }}>
                                      ₹{food.price}
                                    </span>
                                    <span style={{
                                      fontSize: '10px', fontWeight: 700, background: '#dcfce7',
                                      color: '#16a34a', padding: '1px 5px', borderRadius: '4px'
                                    }}>
                                      {food.discount}% OFF
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E23744, #d62b38)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                    background: '#fff', border: '1px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#9ca3af', fontSize: '13px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Searching database...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input with Voice */}
            <div style={{
              padding: '12px 16px',
              background: '#fff',
              borderTop: '2px solid #fee2e2',
              display: 'flex',
              gap: '8px',
              flexShrink: 0
            }}>
              {/* Voice Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: isListening ? '#E23744' : '#f3f4f6',
                  border: isListening ? '2px solid #E23744' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                  animation: isListening ? 'voicePulse 1.5s ease-in-out infinite' : 'none'
                }}
              >
                {isListening ? <MicOff size={18} color="#fff" /> : <Mic size={18} color="#6b7280" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={isListening ? '🎤 Listening...' : 'Ask about dishes, restaurants...'}
                id="chatbot-input"
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '12px',
                  border: '1px solid #e5e7eb', background: '#f9fafb',
                  color: '#1f2937', fontSize: '14px', outline: 'none',
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
                    ? 'linear-gradient(135deg, #E23744, #d62b38)' : '#f3f4f6',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0
                }}
              >
                <Send size={18} color={input.trim() && !isLoading ? '#fff' : '#d1d5db'} />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(226, 55, 68, 0.45), 0 0 0 4px rgba(226, 55, 68, 0.15); }
          50% { box-shadow: 0 8px 32px rgba(226, 55, 68, 0.6), 0 0 0 8px rgba(226, 55, 68, 0.1); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(226, 55, 68, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(226, 55, 68, 0); }
        }
      `}</style>
    </>
  );
}
