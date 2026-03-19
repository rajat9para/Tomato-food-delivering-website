import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Restaurant from '../models/Restaurant';
import FoodItem from '../models/FoodItem';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import User, { Message } from '../models/User';

export const createRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { name, imageUrl } = req.body;
    const existing = await Restaurant.findOne({ ownerId: req.user!.id });
    if (existing) return res.status(400).json({ message: 'Restaurant already exists' });

    const restaurant = await Restaurant.create({ name, imageUrl, ownerId: req.user!.id });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id, approvalStatus: 'approved' });
    if (!restaurant) return res.status(403).json({ message: 'Restaurant not approved' });

    const { name, description, price, category, discount, images } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ message: 'Name, description, and price are required' });
    }

    let imageArray = [];
    if (images) {
      if (Array.isArray(images)) {
        imageArray = images.slice(0, 4);
      } else {
        imageArray = [images];
      }
    }

    const discountValue = Number(discount) || 0;
    if (discountValue < 0 || discountValue > 100) {
      return res.status(400).json({ message: 'Discount must be between 0 and 100' });
    }

    const foodItem = await FoodItem.create({
      restaurantId: restaurant._id,
      name,
      description,
      price: Number(price),
      discount: discountValue,
      category: category || 'Main Course',
      images: imageArray,
      availability: true
    });
    res.status(201).json(foodItem);
  } catch (error) {
    console.error('Add food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyFoodItems = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const items = await FoodItem.find({ restaurantId: restaurant._id });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.price) updateData.price = Number(req.body.price);
    if (req.body.discount !== undefined) {
      const discountValue = Number(req.body.discount);
      if (discountValue < 0 || discountValue > 100) {
        return res.status(400).json({ message: 'Discount must be between 0 and 100' });
      }
      updateData.discount = discountValue;
    }
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.availability !== undefined) updateData.availability = req.body.availability;
    if (req.body.images) {
      let imageArray = [];
      if (Array.isArray(req.body.images)) {
        imageArray = req.body.images.slice(0, 4);
      } else {
        imageArray = [req.body.images];
      }
      updateData.images = imageArray;
    }

    const updated = await FoodItem.findOneAndUpdate(
      { _id: id, restaurantId: restaurant._id },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFoodItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    await FoodItem.findOneAndDelete({ _id: id, restaurantId: restaurant._id });
    res.json({ message: 'Food item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const orders = await Order.find({ restaurantId: restaurant._id })
      .populate('customerId', 'name email phone')
      .populate('items.foodId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    await Order.findOneAndUpdate({ _id: id, restaurantId: restaurant._id }, { orderStatus });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Parallelize all aggregation queries for performance
    const [
      todayRevenueRes,
      weeklyRevenueRes,
      monthlyRevenueRes,
      totalRevenueRes,
      yearlyRevenueRes,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      totalOrders
    ] = await Promise.all([
      // Revenue Aggregations
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$baseAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$baseAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$baseAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$baseAmount' } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$baseAmount' } } }
      ]),
      // Order Counts
      Order.countDocuments({ restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: todayStart } }),
      Order.countDocuments({ restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: weekStart } }),
      Order.countDocuments({ restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: monthStart } }),
      Order.countDocuments({ restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' } })
    ]);

    const avgOrderValue = totalOrders > 0 ? (totalRevenueRes[0]?.total || 0) / totalOrders : 0;

    // Generate chart data based on period
    let chartData: any[] = [];
    let chartLabels: string[] = [];
    let periodLabel: string;
    let startDate: Date;
    let endDate: Date = now;

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
        startDate = yearStart;
        periodLabel = now.getFullYear().toString();
        break;
      default:
        startDate = monthStart;
        periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // Chart Data Aggregation (separate awaited call as it depends on switch)
    if (period === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourlyData = await Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $hour: '$createdAt' }, revenue: { $sum: '$baseAmount' } } }
      ]);
      const hourlyMap = new Map(hourlyData.map(item => [item._id, item.revenue]));
      chartData = hours.map(hour => ({ label: `${hour}:00`, value: hourlyMap.get(hour) || 0 }));
      chartLabels = hours.map(hour => `${hour}:00`);

    } else if (period === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyData = await Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, revenue: { $sum: '$baseAmount' } } }
      ]);
      const dailyMap = new Map(dailyData.map(item => [item._id - 1, item.revenue]));
      chartData = days.map((day, index) => ({ label: day, value: dailyMap.get(index) || 0 }));
      chartLabels = days;

    } else if (period === 'monthly') {
      const weeksData = await Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $week: '$createdAt' }, revenue: { $sum: '$baseAmount' } } },
        { $sort: { '_id': 1 } }
      ]);
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      const weeksMap = new Map(weeksData.map((item, index) => [index, item.revenue])); // Rough mapping, simplified
      // Note: $week returns week number of year (0-53). Mapping directly to 0-4 index is tricky without offset.
      // For simplicity/robustness in this view, we'll just push what we found or map standard 4 weeks
      chartData = weeksData.map((d, i) => ({ label: `Week ${i + 1}`, value: d.revenue }));
      chartLabels = chartData.map(d => d.label);

    } else if (period === 'yearly') {
      const monthsData = await Order.aggregate([
        { $match: { restaurantId: restaurant._id, orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$baseAmount' } } },
        { $sort: { '_id': 1 } }
      ]);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsMap = new Map(monthsData.map(item => [item._id - 1, item.revenue]));
      chartData = monthNames.map((month, index) => ({ label: month, value: monthsMap.get(index) || 0 }));
      chartLabels = monthNames;
    }

    res.json({
      revenue: totalRevenueRes[0]?.total || 0,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue),
      todayRevenue: todayRevenueRes[0]?.total || 0,
      weeklyRevenue: weeklyRevenueRes[0]?.total || 0,
      monthlyRevenue: monthlyRevenueRes[0]?.total || 0,
      yearlyRevenue: yearlyRevenueRes[0]?.total || 0,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      periodRevenue: monthlyRevenueRes[0]?.total || 0,
      periodLabel,
      chartData,
      chartLabels
    });
  } catch (error) {
    console.error('Revenue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });

    if (restaurant) {
      await Promise.all([
        FoodItem.deleteMany({ restaurantId: restaurant._id }),
        Order.deleteMany({ restaurantId: restaurant._id }),
        Transaction.deleteMany({ restaurantId: restaurant._id }),
        Restaurant.findByIdAndDelete(restaurant._id)
      ]);
    }

    await User.findByIdAndDelete(req.user!.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRestaurantImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.imageUrl = imageUrl;
    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRestaurantDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone, openingTime, closingTime, description } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (name) restaurant.name = name;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (openingTime !== undefined) restaurant.openingTime = openingTime;
    if (closingTime !== undefined) restaurant.closingTime = closingTime;
    if (description !== undefined) restaurant.description = description;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleActiveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user!.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    restaurant.activeStatus = !restaurant.activeStatus;
    await restaurant.save();
    res.json({ activeStatus: restaurant.activeStatus });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({ toUserId: req.user!.id })
      .populate('fromUserId', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Message.findOneAndUpdate(
      { _id: id, toUserId: req.user!.id },
      { isRead: true }
    );
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadMessageCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Message.countDocuments({
      toUserId: req.user!.id,
      isRead: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
