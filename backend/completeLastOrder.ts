import mongoose from 'mongoose';
import { MONGODB_URI } from './config';
import Order from './models/Order';

const completeLast = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(MONGODB_URI as string);
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (order) {
            order.orderStatus = 'completed';
            await order.save();
            console.log('Marked order as completed:', order._id);
        } else {
            console.log('No orders found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};
completeLast();
