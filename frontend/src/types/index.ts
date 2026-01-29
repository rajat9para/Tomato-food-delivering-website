// Enums
export type UserRole = 'customer' | 'owner' | 'admin';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'UPI' | 'Card' | 'COD';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type CuisineType = 'Indian' | 'Chinese' | 'Italian' | 'Mexican' | 'American' | 'Thai' | 'Japanese' | 'Continental' | 'Fast Food' | 'Desserts' | 'Beverages';
export type FoodCategory = 'Appetizers' | 'Main Course' | 'Desserts' | 'Beverages' | 'Breads' | 'Rice' | 'Salads' | 'Soups';
export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Egg';

// Types for API responses and props
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked';
  phone?: string;
  createdAt: Date;
}

export interface Restaurant {
  _id: string;
  name: string;
  ownerId: string | User;
  cuisineType?: CuisineType[];
  description?: string;
  address?: string;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
  rating?: number;
  totalReviews?: number;
  imageUrl?: string;
  coverImage?: string;
  approvalStatus: ApprovalStatus;
  activeStatus: boolean;
  createdAt: Date;
}

export interface FoodItem {
  _id: string;
  restaurantId: string | Restaurant;
  name: string;
  description: string;
  price: number;
  category?: FoodCategory;
  dietType?: DietType;
  imageUrl?: string;
  availability: boolean;
  rating?: number;
  isBestseller?: boolean;
}

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderItem {
  foodId: string | FoodItem;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  customerId: string | User;
  restaurantId: string | Restaurant;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  orderStatus: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  deliveryAddress?: string;
  customerPhone?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  userId: string | User;
  restaurantId: string | Restaurant;
  orderId?: string | Order;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  ordersToday: number;
  approvedRestaurants: number;
  pendingRestaurants: number;
  totalRevenue: number;
}

export interface RevenueByRestaurant {
  _id: string;
  restaurantName: string;
  total: number;
}