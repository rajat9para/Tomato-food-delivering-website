import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  customerId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  images: string[];
  status: 'unread' | 'read';
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IContact>('Contact', ContactSchema);
