import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'owner' | 'customer';
  status: 'active' | 'blocked';
  address?: string;
  phone?: string;
  profilePhoto?: string;
  walletBalance?: number;
  premiumMember?: boolean;
  premiumExpiry?: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'owner', 'customer'], required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  address: { type: String },
  phone: { type: String },
  profilePhoto: { type: String },
  walletBalance: { type: Number, default: 0 },
  premiumMember: { type: Boolean, default: false },
  premiumExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', userSchema);

// Message model for admin-owner communication
export interface IMessage extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  isRead: boolean;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  attachments: [{ type: String }]
}, {
  timestamps: true
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
