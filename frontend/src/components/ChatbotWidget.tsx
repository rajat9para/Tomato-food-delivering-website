import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ChevronRight,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  SlidersHorizontal,
  Star,
  Store,
  X
} from 'lucide-react';
import api from '../utils/api';
import { getImageUrl } from '../utils/formatters';

type SortOption = 'rating' | 'price' | 'discount';

interface RestaurantResult {
  _id: string;
  type?: 'restaurant';
  name: string;
  cuisineType?: string[];
  rating: number;
  totalReviews?: number;
  address?: string;
  phone?: string;
  imageUrl?: string;
  coverImage?: string;
  openingTime?: string;
  closingTime?: string;
  averagePrice?: number;
  maxDiscount?: number;
  menuCount?: number;
}

interface FoodResult {
  _id: string;
  type?: 'food';
  name: string;
  price: number;
  discount: number;
  category: string;
  images: string[];
  description: string;
  restaurant: RestaurantResult;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  foods?: FoodResult[];
  restaurants?: RestaurantResult[];
}

interface ChatbotWidgetProps {
  onRestaurantSelect?: (restaurant: RestaurantResult) => void;
}

export default function ChatbotWidget({ onRestaurantSelect }: ChatbotWidgetProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi, I am your Tomato assistant. Ask for a dish, cuisine, restaurant, price range, or discount and I will search the live database.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
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
      window.setTimeout(() => sendMessageWithText(transcript), 250);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendMessageWithText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmed,
        timestamp: new Date()
      }
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/chatbot/chat', { message: trimmed, sortBy });
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.response || 'I found these matches from the database.',
          timestamp: new Date(),
          foods: data.foods || [],
          restaurants: data.restaurants || []
        }
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content: error.response?.data?.response || 'The chatbot could not respond right now. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openRestaurant = (restaurant: RestaurantResult) => {
    const normalizedRestaurant = {
      ...restaurant,
      coverImage: restaurant.coverImage || restaurant.imageUrl
    };

    if (onRestaurantSelect) {
      onRestaurantSelect(normalizedRestaurant);
      setIsOpen(false);
      return;
    }

    navigate('/customer/home', { state: { selectedRestaurant: normalizedRestaurant } });
    setIsOpen(false);
  };

  const sortFoods = (foods: FoodResult[]) => {
    return [...foods].sort((a, b) => {
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
      return (b.restaurant?.rating || 0) - (a.restaurant?.rating || 0);
    });
  };

  const sortRestaurants = (restaurants: RestaurantResult[]) => {
    return [...restaurants].sort((a, b) => {
      if (sortBy === 'price') return (a.averagePrice || 0) - (b.averagePrice || 0);
      if (sortBy === 'discount') return (b.maxDiscount || 0) - (a.maxDiscount || 0);
      return (b.rating || 0) - (a.rating || 0);
    });
  };

  const discountedPrice = (food: FoodResult) => {
    return Math.round(food.price * (1 - (food.discount || 0) / 100));
  };

  const sortLabel = (option: SortOption) => {
    if (option === 'price') return 'Lowest price';
    if (option === 'discount') return 'Best discount';
    return 'Top rated';
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="chatbot-toggle"
          aria-label="Open Tomato AI assistant"
          className="fixed bottom-6 right-6 z-[9999] h-[60px] w-[60px] rounded-full border-[3px] border-white bg-primary text-white shadow-[0_8px_32px_rgba(226,55,68,0.45)] transition hover:scale-110"
        >
          <MessageCircle size={26} className="mx-auto" />
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[9999] flex h-screen w-[430px] max-w-full flex-col border-l-[3px] border-primary bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-primary px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="text-lg font-black">Tomato AI Assistant</div>
                  <div className="text-xs font-bold text-white/80">Live dishes, menus, and restaurants</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                id="chatbot-close"
                aria-label="Close Tomato AI assistant"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
              >
                <X size={20} />
              </button>
            </header>

            <div className="border-b border-red-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-400">
                <SlidersHorizontal size={14} />
                Sort results
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['rating', 'price', 'discount'] as SortOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`rounded-lg px-2 py-2 text-xs font-black transition ${
                      sortBy === option
                        ? 'bg-primary text-white shadow-md shadow-red-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-primary'
                    }`}
                  >
                    {sortLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <main className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
              {messages.map(message => (
                <div key={message.id}>
                  <div className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <Bot size={15} />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-primary text-white'
                          : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>

                  {message.role === 'assistant' && Boolean(message.restaurants?.length) && (
                    <section className="ml-10 mt-3 space-y-2">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-400">Restaurants</p>
                      {sortRestaurants(message.restaurants || []).map(restaurant => (
                        <button
                          key={restaurant._id}
                          onClick={() => openRestaurant(restaurant)}
                          className="flex w-full gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-red-50">
                            {restaurant.coverImage || restaurant.imageUrl ? (
                              <img
                                src={getImageUrl(restaurant.coverImage || restaurant.imageUrl)}
                                alt={restaurant.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-primary">
                                <Store size={22} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-gray-900">{restaurant.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-500">
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-green-700">
                                <Star size={10} fill="currentColor" /> {restaurant.rating?.toFixed(1) || 'New'}
                              </span>
                              <span>{restaurant.menuCount || 0} items</span>
                              {restaurant.maxDiscount ? <span>{restaurant.maxDiscount}% off</span> : null}
                            </div>
                            {restaurant.address && (
                              <div className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-400">
                                <MapPin size={10} />
                                <span className="truncate">{restaurant.address}</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={18} className="mt-5 shrink-0 text-primary" />
                        </button>
                      ))}
                    </section>
                  )}

                  {message.role === 'assistant' && Boolean(message.foods?.length) && (
                    <section className="ml-10 mt-3 space-y-2">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-400">Dishes</p>
                      {sortFoods(message.foods || []).map(food => (
                        <button
                          key={food._id}
                          onClick={() => openRestaurant(food.restaurant)}
                          className="flex w-full gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-red-50">
                            {food.images?.[0] ? (
                              <img
                                src={getImageUrl(food.images[0])}
                                alt={food.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black text-primary">
                                {food.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-gray-900">{food.name}</div>
                            <div className="mt-1 truncate text-[11px] font-bold text-gray-500">
                              {food.restaurant?.name || 'Restaurant'}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center text-sm font-black text-primary">
                                <IndianRupee size={12} />
                                {food.discount > 0 ? discountedPrice(food) : food.price}
                              </span>
                              {food.discount > 0 && (
                                <>
                                  <span className="text-xs font-bold text-gray-300 line-through">Rs {food.price}</span>
                                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-black text-green-700">
                                    {food.discount}% off
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={18} className="mt-5 shrink-0 text-primary" />
                        </button>
                      ))}
                    </section>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                    <Bot size={15} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-500 shadow-sm">
                    <Loader2 size={15} className="animate-spin" />
                    Searching live database...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>

            <footer className="flex gap-2 border-t-2 border-red-100 bg-white p-3">
              <button
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                  isListening ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-100 text-gray-500'
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && sendMessageWithText(input)}
                placeholder={isListening ? 'Listening...' : 'Ask about dishes, offers, or restaurants'}
                id="chatbot-input"
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary"
              />
              <button
                onClick={() => sendMessageWithText(input)}
                disabled={isLoading || !input.trim()}
                id="chatbot-send"
                aria-label="Send chatbot message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition disabled:bg-gray-100 disabled:text-gray-300"
              >
                <Send size={18} />
              </button>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
