import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  images: string[];
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any, restaurant: any) => void;
  updateQuantity: (foodId: string, delta: number) => void;
  removeFromCart: (foodId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getRestaurantCount: () => number;
  getItemsByRestaurant: () => { [restaurantId: string]: CartItem[] };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('customerCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customerCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: any, restaurant: any) => {
    if (!item.availability) {
      alert('This item is currently unavailable');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(c => c.foodId === item._id);
      if (existing) {
        return prevCart.map(c =>
          c.foodId === item._id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      } else {
        return [...prevCart, {
          foodId: item._id,
          name: item.name,
          price: item.price,
          discount: item.discount || 0,
          quantity: 1,
          images: item.images || [],
          restaurantId: restaurant._id,
          restaurantName: restaurant.name
        }];
      }
    });
  };

  const updateQuantity = (foodId: string, delta: number) => {
    setCart(prevCart =>
      prevCart.map(c => {
        if (c.foodId === foodId) {
          const newQty = c.quantity + delta;
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (foodId: string) => {
    setCart(prevCart => prevCart.filter(c => c.foodId !== foodId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((sum, c) => {
      const discountedPrice = c.price * (1 - c.discount / 100);
      return sum + discountedPrice * c.quantity;
    }, 0);
  };

  const getRestaurantCount = () => {
    const restaurantIds = new Set(cart.map(item => item.restaurantId));
    return restaurantIds.size;
  };

  const getItemsByRestaurant = () => {
    return cart.reduce((acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = [];
      }
      acc[item.restaurantId].push(item);
      return acc;
    }, {} as { [restaurantId: string]: CartItem[] });
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getTotal,
      getRestaurantCount,
      getItemsByRestaurant
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
