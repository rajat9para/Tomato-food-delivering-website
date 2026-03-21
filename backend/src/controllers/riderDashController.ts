import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import User from '../models/User';

/**
 * GET /api/rider/available-orders
 * Get all orders with status 'ready' that have no rider assigned
 */
export const getAvailableOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({
      orderStatus: 'ready',
      riderId: { $exists: false }
    })
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/rider/accept-order/:id
 * Rider accepts an order from the waiting queue
 */
export const acceptOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = req.user!._id;

    // Check rider availability
    const rider = await User.findById(riderId);
    if (!rider || !rider.isAvailable) {
      return res.status(400).json({ message: 'You must be available to accept orders' });
    }

    // Check if rider already has an active delivery
    const activeDelivery = await Order.findOne({
      riderId,
      orderStatus: { $in: ['ready', 'out_for_delivery'] }
    });
    if (activeDelivery) {
      return res.status(400).json({ message: 'You already have an active delivery. Complete it first.' });
    }

    // Atomically assign rider (prevents race conditions)
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        orderStatus: 'ready',
        riderId: { $exists: false }
      },
      {
        riderId,
        riderAssignedAt: new Date()
      },
      { new: true }
    )
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not available or already taken by another rider' });
    }

    // Mark rider as busy
    await User.findByIdAndUpdate(riderId, { isAvailable: false });

    res.json({ message: 'Order accepted successfully', order });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/rider/start-delivery/:id
 * Rider starts the journey → status becomes 'out_for_delivery'
 */
export const startDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = req.user!._id;

    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        riderId,
        orderStatus: 'ready'
      },
      {
        orderStatus: 'out_for_delivery',
        deliveryStartedAt: new Date()
      },
      { new: true }
    )
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not in correct state' });
    }

    res.json({ message: 'Delivery started! Head to the customer.', order });
  } catch (error) {
    console.error('Start delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/rider/complete-delivery/:id
 * Rider completes delivery → status becomes 'delivered'
 */
export const completeDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = req.user!._id;

    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        riderId,
        orderStatus: 'out_for_delivery'
      },
      {
        orderStatus: 'delivered',
        deliveredAt: new Date()
      },
      { new: true }
    )
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not in correct state' });
    }

    // Mark rider as available again
    await User.findByIdAndUpdate(riderId, { isAvailable: true });

    res.json({ message: 'Delivery completed! Great job! 🎉', order });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/rider/my-deliveries
 * Get rider's current and past deliveries
 */
export const getMyDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = req.user!._id;

    const deliveries = await Order.find({ riderId })
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name')
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (error) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/rider/active-delivery
 * Get the rider's current active delivery (if any)
 */
export const getActiveDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = req.user!._id;

    const activeOrder = await Order.findOne({
      riderId,
      orderStatus: { $in: ['ready', 'out_for_delivery'] }
    })
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('customerId', 'name phone address')
      .populate('items.foodId', 'name');

    res.json(activeOrder || null);
  } catch (error) {
    console.error('Get active delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/rider/profile
 */
export const getRiderProfile = async (req: AuthRequest, res: Response) => {
  try {
    const rider = await User.findById(req.user!._id).select('-password');
    if (!rider) return res.status(404).json({ message: 'Rider not found' });

    // Get stats
    const totalDeliveries = await Order.countDocuments({
      riderId: rider._id,
      orderStatus: { $in: ['delivered', 'completed'] }
    });

    const totalEarnings = await Order.aggregate([
      {
        $match: {
          riderId: rider._id,
          orderStatus: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$platformFeeAmount' }
        }
      }
    ]);

    res.json({
      ...rider.toObject(),
      totalDeliveries,
      totalEarnings: totalEarnings[0]?.total || 0
    });
  } catch (error) {
    console.error('Get rider profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/rider/profile
 */
export const updateRiderProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address, vehicleType, isAvailable } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (vehicleType && ['bike', 'scooter', 'car', 'bicycle'].includes(vehicleType)) {
      updateData.vehicleType = vehicleType;
    }
    if (typeof isAvailable === 'boolean') {
      // Only allow going offline if no active delivery
      if (!isAvailable) {
        const activeDelivery = await Order.findOne({
          riderId: req.user!._id,
          orderStatus: { $in: ['ready', 'out_for_delivery'] }
        });
        if (activeDelivery) {
          return res.status(400).json({ message: 'Cannot go offline while you have an active delivery' });
        }
      }
      updateData.isAvailable = isAvailable;
    }

    const updated = await User.findByIdAndUpdate(req.user!._id, updateData, { new: true }).select('-password');
    res.json(updated);
  } catch (error) {
    console.error('Update rider profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/rider/stats
 * Get rider statistics
 */
export const getRiderStats = async (req: AuthRequest, res: Response) => {
  try {
    const riderId = req.user!._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalDeliveries, todayDeliveries, totalEarnings, todayEarnings] = await Promise.all([
      Order.countDocuments({ riderId, orderStatus: { $in: ['delivered', 'completed'] } }),
      Order.countDocuments({ riderId, orderStatus: { $in: ['delivered', 'completed'] }, deliveredAt: { $gte: today } }),
      Order.aggregate([
        { $match: { riderId, orderStatus: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$platformFeeAmount' } } }
      ]),
      Order.aggregate([
        { $match: { riderId, orderStatus: { $in: ['delivered', 'completed'] }, deliveredAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$platformFeeAmount' } } }
      ])
    ]);

    res.json({
      totalDeliveries,
      todayDeliveries,
      totalEarnings: totalEarnings[0]?.total || 0,
      todayEarnings: todayEarnings[0]?.total || 0
    });
  } catch (error) {
    console.error('Get rider stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
