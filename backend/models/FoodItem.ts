import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  discount: number;
  availability: boolean;
  images: string[];
  category?: string;
}

const foodItemSchema = new Schema<IFoodItem>({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  availability: { type: Boolean, default: true },
  images: [{ type: String }],
  category: { type: String, default: 'Main Course' }
});

// Indexes for performance
foodItemSchema.index({ availability: 1, createdAt: -1 }); // For featured dishes
foodItemSchema.index({ availability: 1, discount: -1, price: 1 }); // For best dishes
foodItemSchema.index({ availability: 1, name: 1 }); // For search
foodItemSchema.index({ restaurantId: 1, availability: 1 }); // For restaurant menu

export default mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
