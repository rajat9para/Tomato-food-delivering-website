import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Restaurant from '../models/Restaurant';
import FoodItem from '../models/FoodItem';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import Contact from '../models/Contact';

export const getRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ approvalStatus: 'approved', activeStatus: true })
      .populate('ownerId', 'name email')
      .lean();

    const restaurantIds = restaurants.map(r => r._id);

    // Efficiently fetch first images for all restaurants in one go
    const foodItems = await FoodItem.aggregate([
      { $match: { restaurantId: { $in: restaurantIds }, images: { $exists: true, $ne: [] } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$restaurantId', firstImage: { $first: { $arrayElemAt: ['$images', 0] } } } }
    ]);

    const imageMap = new Map(foodItems.map(item => [item._id.toString(), item.firstImage]));

    const restaurantsWithImages = restaurants.map(restaurant => ({
      ...restaurant,
      coverImage: imageMap.get(restaurant._id.toString()) || restaurant.imageUrl
    }));

    res.json(restaurantsWithImages);
  } catch (error) {
    console.error('getRestaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBestRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ approvalStatus: 'approved', activeStatus: true })
      .populate('ownerId', 'name email')
      .sort({ rating: -1 })
      .lean();

    const restaurantIds = restaurants.map(r => r._id);

    const foodItems = await FoodItem.aggregate([
      { $match: { restaurantId: { $in: restaurantIds }, images: { $exists: true, $ne: [] } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$restaurantId', firstImage: { $first: { $arrayElemAt: ['$images', 0] } } } }
    ]);

    const imageMap = new Map(foodItems.map(item => [item._id.toString(), item.firstImage]));

    const restaurantsWithImages = restaurants.map(restaurant => ({
      ...restaurant,
      coverImage: imageMap.get(restaurant._id.toString()) || restaurant.imageUrl
    }));

    res.json(restaurantsWithImages);
  } catch (error) {
    console.error('getBestRestaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFeaturedDishes = async (req: AuthRequest, res: Response) => {
  try {
    // Use aggregation for better performance with filtering
    const dishes = await FoodItem.aggregate([
      {
        $match: {
          availability: true,
          images: { $exists: true, $ne: [] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 4
      }
    ]);

    res.json(dishes);
  } catch (error) {
    console.error('getFeaturedDishes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBestDishes = async (req: AuthRequest, res: Response) => {
  try {
    const dishes = await FoodItem.find({
      availability: true,
      images: { $exists: true, $ne: [] }
    })
      .sort({ discount: -1, price: 1 })
      .limit(10);

    res.json(dishes);
  } catch (error) {
    console.error('getBestDishes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGreatDeals = async (req: AuthRequest, res: Response) => {
  try {
    const { sort = 'discount' } = req.query;
    let sortOptions: any = { discount: -1 };

    if (sort === 'price') {
      sortOptions = { price: 1 };
    } else if (sort === 'rating') {
      sortOptions = { 'restaurantId.rating': -1 };
    }

    const dishes = await FoodItem.find({
      availability: true,
      images: { $exists: true, $ne: [] }
    })
      .populate('restaurantId', 'name rating')
      .sort(sortOptions)
      .limit(20);

    res.json(dishes);
  } catch (error) {
    console.error('getGreatDeals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurantMenu = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const items = await FoodItem.find({ restaurantId: id, availability: true });
    res.json(items);
  } catch (error) {
    console.error('getRestaurantMenu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, items, totalAmount, paymentMethod, deliveryAddress } = req.body;

    console.log('🔄 Processing order request:', {
      restaurantId,
      itemsCount: items?.length,
      totalAmount,
      paymentMethod,
      userId: req.user!._id
    });

    // Detailed Validation
    const missingFields = [];
    if (!restaurantId) missingFields.push('restaurantId');
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items');
    if (!totalAmount && totalAmount !== 0) missingFields.push('totalAmount');
    if (!paymentMethod) missingFields.push('paymentMethod');
    if (!deliveryAddress) missingFields.push('deliveryAddress');

    if (missingFields.length > 0) {
      console.error('❌ Validation failed. Missing fields:', missingFields);
      console.error('📦 Received body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate delivery address details
    const missingAddressFields = [];
    if (!deliveryAddress.name) missingAddressFields.push('name');
    if (!deliveryAddress.phone) missingAddressFields.push('phone');
    if (!deliveryAddress.address) missingAddressFields.push('address');

    if (missingAddressFields.length > 0) {
      console.error('❌ Validation failed. Incomplete delivery address:', missingAddressFields);
      return res.status(400).json({ message: `Delivery address missing: ${missingAddressFields.join(', ')}` });
    }

    // Validate payment method
    const validPaymentMethods = ['UPI', 'Card', 'COD'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      console.error('❌ Invalid payment method:', paymentMethod);
      return res.status(400).json({ message: `Invalid payment method: ${paymentMethod}` });
    }

    console.log('✅ Payment and Address validation passed');

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.error('❌ Restaurant not found:', restaurantId);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log('✅ Restaurant validation passed:', (restaurant as any).name);

    // Validate items
    for (const item of items) {
      if (!item.foodId || !item.quantity || item.quantity <= 0 || !item.price) {
        console.error('❌ Invalid item data:', item);
        return res.status(400).json({ message: 'Invalid item data' });
      }

      const foodItem = await FoodItem.findById(item.foodId);
      if (!foodItem || !foodItem.availability) {
        console.error('❌ Item not available:', item.foodId);
        return res.status(400).json({ message: `Item ${item.foodId} is not available` });
      }
    }

    console.log('✅ All items validated successfully');

    // Calculate payment breakdown
    const baseAmount = totalAmount;
    const gstAmount = Math.round(baseAmount * 0.01); // 1% GST
    const platformFeeAmount = Math.round(baseAmount * 0.01); // 1% Platform fee
    const finalTotalAmount = baseAmount + gstAmount + platformFeeAmount;

    console.log('💰 Payment breakdown:', { baseAmount, gstAmount, platformFeeAmount, finalTotalAmount });

    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      customerId: req.user!._id,
      restaurantId,
      items,
      baseAmount,
      gstAmount,
      platformFeeAmount,
      totalAmount: finalTotalAmount,
      deliveryAddress,
      orderStatus: 'pending'
    };

    console.log('📝 Creating order with data:', orderData);

    const order = await Order.create(orderData);

    console.log('✅ Order created successfully:', order._id);

    const transactionData = {
      transactionId,
      orderId: order._id,
      userId: req.user!._id,
      restaurantId,
      amount: finalTotalAmount,
      gstAmount,
      platformFeeAmount,
      paymentMethod,
      paymentStatus: 'success',
      transactionType: 'order'
    };

    console.log('💳 Creating transaction:', transactionData);

    await Transaction.create(transactionData);

    console.log('✅ Transaction created successfully:', transactionId);

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
      transactionId,
      paymentMethod
    });
  } catch (error: any) {
    console.error('💥 Place order error:', {
      error: error.message,
      stack: error.stack,
      paymentMethod: req.body?.paymentMethod
    });
    res.status(500).json({
      message: 'Failed to place order',
      error: error.message,
      paymentMethod: req.body?.paymentMethod
    });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 GETTING ORDERS FOR USER:', req.user!._id);
    console.log('📝 User object:', req.user);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('❌ No user authentication found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user._id;
    console.log('👤 Using customerId:', userId);

    // First, let's count all orders to debug
    const totalOrdersCount = await Order.countDocuments();
    console.log('📊 Total orders in database:', totalOrdersCount);

    // Count orders for this user
    const userOrdersCount = await Order.countDocuments({ customerId: userId });
    console.log('📊 Orders for this user:', userOrdersCount);

    // Get actual orders
    const orders = await Order.find({ customerId: userId })
      .populate('restaurantId', 'name')
      .populate('items.foodId', 'name price')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders for user ${userId}`);
    console.log('📋 Order details:', orders.map(order => ({
      id: order._id,
      status: order.orderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      restaurant: (order.restaurantId as any)?.name || 'Unknown'
    })));

    res.json(orders);
  } catch (error) {
    console.error('💥 getMyOrders critical error:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: (error as any).message
    });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, customerId: req.user!._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending orders' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rateOrder = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Starting rateOrder process...');
    console.log('📦 Request body:', req.body);
    console.log('📁 Files received:', req.files);

    const { orderId, rating, review } = req.body;
    const files = req.files as Express.Multer.File[];

    console.log('🔍 Parsed data:', { orderId, rating, review, filesCount: files?.length });

    if (!orderId) {
      console.log('❌ Missing orderId in/from body/multipart');
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const ratingValue = Number(rating);
    const orderIdString = String(orderId);

    console.log('🔍 Parsed data:', { orderId: orderIdString, rating: ratingValue, review, filesCount: files?.length });

    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      console.log('❌ Invalid rating value:', rating);
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    // Validate ObjectId format to prevent CastError
    if (!orderIdString.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid Order ID format:', orderIdString);
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    console.log('🔍 Looking for order:', orderIdString, 'for user:', req.user!._id);
    const order = await Order.findOne({ _id: orderIdString, customerId: req.user!._id });
    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', order._id, 'Status:', order.orderStatus);

    if (order.orderStatus !== 'completed') {
      console.log('❌ Order not completed, status:', order.orderStatus);
      return res.status(400).json({ message: 'Can only rate completed orders' });
    }

    if (order.rating && order.rating > 0) {
      console.log('❌ Order already rated:', order.rating);
      return res.status(400).json({ message: 'Order already rated' });
    }

    const ratingImages = files?.map(file => `/uploads/${file.filename}`) || [];
    console.log('📸 Rating images:', ratingImages);

    console.log('💾 Updating order with rating data...');
    order.rating = ratingValue;
    order.review = review || '';
    order.ratingImages = ratingImages;

    console.log('💾 Saving order...');
    await order.save();
    console.log('✅ Order saved successfully');

    // Update restaurant rating
    if (order.restaurantId) {
      console.log('🏪 Updating restaurant rating...');
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant) {
        console.log('🏪 Found restaurant:', restaurant._id);
        const allOrders = await Order.find({
          restaurantId: order.restaurantId,
          orderStatus: 'completed',
          rating: { $gt: 0 }
        });

        console.log('📊 Found', allOrders.length, 'rated orders for restaurant');
        if (allOrders.length > 0) {
          const totalRating = allOrders.reduce((sum, o) => sum + (o.rating || 0), 0);
          const avgRating = totalRating / allOrders.length;

          console.log('📈 New average rating:', avgRating);
          restaurant.rating = Math.round(avgRating * 10) / 10;
          restaurant.totalReviews = allOrders.length;
          await restaurant.save();
          console.log('✅ Restaurant rating updated');
        }
      } else {
        console.log('⚠️ Restaurant not found for rating update');
      }
    }

    console.log('🎉 Rating submission completed successfully');
    res.json({ message: 'Rating submitted successfully' });
  } catch (error: any) {
    console.error('💥 Rate order error:', error);
    console.error('💥 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const removeRating = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, customerId: req.user!._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.rating === 0) {
      return res.status(400).json({ message: 'Order has no rating to remove' });
    }

    order.rating = 0;
    order.review = '';
    await order.save();

    // Update restaurant rating
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      const allOrders = await Order.find({
        restaurantId: order.restaurantId,
        orderStatus: 'completed',
        rating: { $gt: 0 }
      });

      if (allOrders.length > 0) {
        const totalRating = allOrders.reduce((sum, o) => sum + o.rating, 0);
        const avgRating = totalRating / allOrders.length;
        restaurant.rating = Math.round(avgRating * 10) / 10;
        restaurant.totalReviews = allOrders.length;
      } else {
        restaurant.rating = 0;
        restaurant.totalReviews = 0;
      }
      await restaurant.save();
    }

    res.json({ message: 'Rating removed successfully' });
  } catch (error) {
    console.error('Remove rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchDishes = async (req: AuthRequest, res: Response) => {
  try {
    const { q: query, sort = 'rating' } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.json([]);
    }

    let sortOptions: any = { 'restaurantId.rating': -1 };

    if (sort === 'price') {
      sortOptions = { price: 1 };
    } else if (sort === 'discount') {
      sortOptions = { discount: -1 };
    }

    const dishes = await FoodItem.find({
      availability: true,
      name: { $regex: query, $options: 'i' }
    })
      .populate('restaurantId', 'name rating cuisineType imageUrl')
      .sort(sortOptions)
      .limit(20);

    res.json(dishes);
  } catch (error) {
    console.error('Search dishes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, senderName } = req.body;
    const files = req.files as Express.Multer.File[];

    const images = files?.map(file => `/uploads/${file.filename}`) || [];

    await Contact.create({
      customerId: req.user!._id,
      senderName,
      message,
      images,
      status: 'unread'
    });

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, address, phone } = req.body;
    const file = req.file as Express.Multer.File;

    console.log('🔄 Update Profile Request:', {
      userId: req.user!._id,
      body: req.body,
      file: file ? file.filename : 'No file'
    });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    if (file) {
      // Normalize path to forward slashes to ensure compatibility
      updateData.profilePhoto = `/uploads/${file.filename}`;
      console.log('📸 New profile photo path:', updateData.profilePhoto);
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updateData, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated successfully for:', user.email);
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rechargeWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: 'Maximum recharge amount is $10,000' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simulate payment processing
    const transactionId = `WALLET${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Update wallet balance
    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      transactionId,
      userId: req.user!._id,
      amount,
      paymentMethod,
      paymentStatus: 'success',
      transactionType: 'wallet_recharge'
    });

    res.json({
      message: 'Wallet recharged successfully',
      walletBalance: user.walletBalance,
      transactionId
    });
  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const purchasePremium = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentMethod, plan = 'monthly' } = req.body;

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.premiumMember && user.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
      return res.status(400).json({ message: 'You already have an active premium membership' });
    }

    // Premium pricing
    const pricing: any = {
      monthly: 9.99,
      yearly: 99.99
    };

    const amount = pricing[plan] || pricing.monthly;
    const transactionId = `PREMIUM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiry date
    const expiryDate = new Date();
    if (plan === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Update user to premium
    user.premiumMember = true;
    user.premiumExpiry = expiryDate;
    await user.save();

    // Create transaction record
    await Transaction.create({
      transactionId,
      userId: req.user!._id,
      amount,
      paymentMethod,
      paymentStatus: 'success',
      transactionType: 'premium_purchase'
    });

    res.json({
      message: 'Premium membership activated successfully',
      premiumMember: true,
      premiumExpiry: expiryDate,
      transactionId
    });
  } catch (error) {
    console.error('Purchase premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurantReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({
      restaurantId: id,
      orderStatus: 'completed',
      rating: { $gt: 0 }
    })
      .populate('customerId', 'name profilePhoto')
      .sort({ createdAt: -1 });

    const reviews = orders.map(order => ({
      _id: order._id,
      customerName: (order.customerId as any)?.name || 'Anonymous',
      customerPhoto: (order.customerId as any)?.profilePhoto,
      rating: order.rating,
      review: order.review,
      images: order.ratingImages,
      createdAt: order.createdAt
    }));

    res.json(reviews);
  } catch (error) {
    console.error('getRestaurantReviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
