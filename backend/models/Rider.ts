import mongoose, { Schema, Document } from 'mongoose';

export interface IRider extends Document {
  name: string;
  phone: string;
  vehicle_type: 'bike' | 'car' | 'scooter' | 'bicycle';
  current_location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'busy';
  createdAt: Date;
  updatedAt: Date;
}

const riderSchema = new Schema<IRider>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  vehicle_type: {
    type: String,
    required: true,
    enum: ['bike', 'car', 'scooter', 'bicycle']
  },
  current_location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'busy'],
    default: 'available'
  }
}, {
  timestamps: true
});

export default mongoose.model<IRider>('Rider', riderSchema);
