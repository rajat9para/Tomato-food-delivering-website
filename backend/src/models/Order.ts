import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
  items: { foodId: mongoose.Types.ObjectId; quantity: number; price: number }[];
  baseAmount: number;
  gstAmount: number;
  platformFeeAmount: number;
  deliveryFeeAmount: number;
  totalAmount: number;
  orderStatus: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  rating: number;
  review: string;
  ratingImages?: string[];
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
    locationConfidence?: number;
  };
  riderAssignedAt?: Date;
  deliveryStartedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  riderId: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{
    foodId: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
    quantity: Number,
    price: Number
  }],
  baseAmount: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  platformFeeAmount: { type: Number, required: true },
  deliveryFeeAmount: { type: Number, default: 30 },
  totalAmount: { type: Number, required: true },
  orderStatus: { type: String, enum: ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'], default: 'pending' },
  rating: { type: Number, default: 0 },
  review: { type: String, default: '' },
  ratingImages: [{ type: String }],
  deliveryAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    formattedAddress: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    locationConfidence: { type: Number }
  },
  riderAssignedAt: { type: Date },
  deliveryStartedAt: { type: Date },
  deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOrder>('Order', orderSchema);
