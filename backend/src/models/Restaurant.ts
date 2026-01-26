import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  restaurantId: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  cuisineType: string[];
  description: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  imageUrl: string;
  coverImage: string;
  rating: number;
  totalReviews: number;
  totalRevenue: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  activeStatus: boolean;
  isRemoved: boolean;
  createdAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>({
  restaurantId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cuisineType: [{ type: String }],
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '22:00' },
  imageUrl: { type: String, default: '/foodimages/Cabbage-Manchurian.jpg' },
  coverImage: { type: String, default: '/foodimages/Cabbage-Manchurian.jpg' },
  rating: { type: Number, default: 3.0 },
  totalReviews: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  activeStatus: { type: Boolean, default: true },
  isRemoved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

restaurantSchema.pre('save', async function(next) {
  if (!this.restaurantId) {
    const prefix = this.name.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 900000) + 100000;
    this.restaurantId = `${prefix}-${random}`;
  }
  next();
});

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
