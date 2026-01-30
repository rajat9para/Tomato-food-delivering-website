import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { Message } from '../models/User';
import Restaurant from '../models/Restaurant';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import Contact from '../models/Contact';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const approvedRestaurants = await Restaurant.countDocuments({ approvalStatus: 'approved' });
    const pendingRestaurants = await Restaurant.countDocuments({ approvalStatus: 'pending' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({
      orderStatus: { $ne: 'cancelled' },
      createdAt: { $gte: today }
    });

    const revenueStats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: '$platformFeeAmount' },
          gstCollection: { $sum: '$gstAmount' },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    const stats = revenueStats[0] || { platformRevenue: 0, gstCollection: 0, totalSales: 0 };

    res.json({
      totalUsers,
      totalRestaurants,
      approvedRestaurants,
      pendingRestaurants,
      ordersToday,
      totalRevenue: stats.platformRevenue,
      gstCollection: stats.gstCollection,
      totalSales: stats.totalSales
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const initializeRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find();
    for (const restaurant of restaurants) {
      if (!restaurant.restaurantId) {
        const prefix = restaurant.name.substring(0, 3).toUpperCase();
        const random = Math.floor(Math.random() * 900000) + 100000;
        restaurant.restaurantId = `${prefix}-${random}`;
      }
      if (restaurant.rating !== 3.0) {
        restaurant.rating = 3.0;
      }
      await restaurant.save();
    }
    res.json({ message: 'Restaurants initialized', count: restaurants.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find().populate('ownerId', 'name email');
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const { sortBy = 'rating' } = req.query;

    let sortField: any = { rating: -1 };
    if (sortBy === 'revenue') sortField = { totalRevenue: -1 };
    if (sortBy === 'worst') sortField = { rating: 1 };

    const topRestaurants = await Restaurant.find({ approvalStatus: 'approved' })
      .populate('ownerId', 'name email')
      .sort(sortField)
      .limit(10);

    res.json(topRestaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;

    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { restaurantId: { $regex: query, $options: 'i' } }
      ]
    }).populate('ownerId', 'name email');

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRestaurantStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalStatus, activeStatus } = req.body;

    const update: any = {};
    if (approvalStatus) update.approvalStatus = approvalStatus;
    if (activeStatus !== undefined) update.activeStatus = activeStatus;

    await Restaurant.findByIdAndUpdate(id, update);
    res.json({ message: 'Restaurant updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Removing restaurant:', id);
    const result = await Restaurant.findByIdAndUpdate(id, { isRemoved: true }, { new: true });
    console.log('✅ Restaurant removed:', result);
    res.json({ message: 'Restaurant removed from platform', restaurant: result });
  } catch (error) {
    console.error('❌ Error removing restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, role } = req.query;
    let query: any = { role: { $ne: 'admin' } };

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await User.findByIdAndUpdate(id, { status });
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    const ordersWithDelay = orders.map((order: any) => {
      const createdTime = new Date(order.createdAt).getTime();
      const currentTime = new Date().getTime();
      const minutesElapsed = Math.floor((currentTime - createdTime) / 60000);
      const isDelayed = order.orderStatus === 'pending' && minutesElapsed > 40;

      return {
        ...order.toObject(),
        minutesElapsed,
        isDelayed
      };
    });

    res.json(ordersWithDelay);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRevenueByRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const revenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$restaurantId', total: { $sum: '$totalAmount' } } },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $project: { restaurantName: '$restaurant.name', restaurantId: '$restaurant.restaurantId', total: 1 } }
    ]);
    res.json(revenue);
  } catch (error) {
    console.error('getRevenueByRestaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInbox = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Contact.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('getInbox error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndUpdate(id, { status: 'read' });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('markMessageRead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessageToOwner = async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, subject, message } = req.body;
    const files = req.files as Express.Multer.File[];

    const restaurant = await Restaurant.findById(restaurantId).populate('ownerId');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const owner = restaurant.ownerId as any;
    const attachments = files?.map(file => `/uploads/${file.filename}`) || [];

    // Save message to database
    const newMessage = await Message.create({
      fromUserId: req.user!.id,
      toUserId: owner._id,
      subject,
      message,
      attachments
    });

    res.json({ message: 'Message sent successfully', messageId: newMessage._id });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSentMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({ fromUserId: req.user!.id })
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    const now = new Date();

    // Calculate today's revenue
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: '$platformFeeAmount' },
          gstCollection: { $sum: '$gstAmount' },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Calculate this week's revenue
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: '$platformFeeAmount' },
          gstCollection: { $sum: '$gstAmount' },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Calculate this month's revenue
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: '$platformFeeAmount' },
          gstCollection: { $sum: '$gstAmount' },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get all-time revenue
    const allTimeStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          platformRevenue: { $sum: '$platformFeeAmount' },
          gstCollection: { $sum: '$gstAmount' },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    const todayData = todayStats[0] || { platformRevenue: 0, gstCollection: 0, totalSales: 0 };
    const weeklyData = weeklyStats[0] || { platformRevenue: 0, gstCollection: 0, totalSales: 0 };
    const monthlyData = monthlyStats[0] || { platformRevenue: 0, gstCollection: 0, totalSales: 0 };
    const allTimeData = allTimeStats[0] || { platformRevenue: 0, gstCollection: 0, totalSales: 0 };

    // Generate chart data based on period (for backward compatibility)
    let chartData: any[] = [];
    let periodLabel: string;
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = todayStart;
        periodLabel = 'Today';
        break;
      case 'weekly':
        startDate = weekStart;
        periodLabel = 'This Week';
        break;
      case 'monthly':
        startDate = monthStart;
        periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        periodLabel = now.getFullYear().toString();
        break;
      default:
        startDate = monthStart;
        periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    if (period === 'monthly') {
      const weeksData = await Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: 'cancelled' },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $week: '$createdAt' },
            revenue: { $sum: '$platformFeeAmount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
      chartData = weeksData.map((w, i) => ({ label: `Week ${i + 1}`, value: w.revenue }));
    } else if (period === 'yearly') {
      const monthsData = await Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: 'cancelled' },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$platformFeeAmount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData = monthsData.map(m => ({ label: monthNames[m._id - 1], value: m.revenue }));
    }

    res.json({
      // All-time metrics
      platformRevenue: allTimeData.platformRevenue,
      gstCollection: allTimeData.gstCollection,
      totalSales: allTimeData.totalSales,

      // Period-specific metrics
      todayPlatformRevenue: todayData.platformRevenue,
      weeklyPlatformRevenue: weeklyData.platformRevenue,
      monthlyPlatformRevenue: monthlyData.platformRevenue,

      todayGstCollection: todayData.gstCollection,
      weeklyGstCollection: weeklyData.gstCollection,
      monthlyGstCollection: monthlyData.gstCollection,

      todayTotalSales: todayData.totalSales,
      weeklyTotalSales: weeklyData.totalSales,
      monthlyTotalSales: monthlyData.totalSales,

      // Chart data (period-based)
      periodLabel,
      chartData
    });
  } catch (error) {
    console.error('getAdminRevenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
