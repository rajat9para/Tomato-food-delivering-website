import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  amount: number;
  gstAmount: number;
  platformFeeAmount: number;
  paymentMethod: 'UPI' | 'Card' | 'COD';
  paymentStatus: 'success' | 'failed';
  transactionType?: 'order' | 'wallet_recharge' | 'premium_purchase';
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  amount: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  platformFeeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'COD'], required: true },
  paymentStatus: { type: String, enum: ['success', 'failed'], default: 'success' },
  transactionType: { type: String, enum: ['order', 'wallet_recharge', 'premium_purchase'], default: 'order' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
