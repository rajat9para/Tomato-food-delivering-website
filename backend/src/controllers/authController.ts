import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Restaurant from '../models/Restaurant';
import { JWT_SECRET } from '../config';

const getPremiumState = (user: any) => {
  const hasActivePremium = Boolean(user.premiumMember && user.premiumExpiry && new Date(user.premiumExpiry) > new Date());
  return {
    premiumMember: hasActivePremium,
    premiumExpiry: hasActivePremium ? user.premiumExpiry : null
  };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (role === 'admin') {
      return res.status(400).json({ message: 'Cannot register as admin' });
    }

    if (!['customer', 'owner', 'rider'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be customer, owner, or rider' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      status: 'active'
    };

    // Add rider-specific defaults
    if (role === 'rider') {
      userData.vehicleType = req.body.vehicleType || 'bike';
      userData.isAvailable = true;
    }

    const user = await User.create(userData);

    console.log('✅ User registered:', user._id, user.role);

    res.status(201).json({
      message: 'Registration successful! Please login.',
      userId: user._id,
      role: user.role
    });
  } catch (error: any) {
    console.error('❌ Registration error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }

    res.status(500).json({
      message: 'Account creation failed. Please try again later.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input exists
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if account is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
    }

    // Check if owner's restaurant is removed/blocked
    if (user.role === 'owner') {
      try {
        const restaurant = await Restaurant.findOne({ ownerId: user._id });
        if (restaurant && restaurant.isRemoved) {
          return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
        }
      } catch (err) {
        // Non-critical: restaurant check failed, allow login to continue
        console.warn('⚠️ Restaurant check failed for owner login:', (err as any).message);
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Sign JWT token using centralized secret
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const premium = getPremiumState(user);

    // Return success with user data
    res.json({
      token,
      role: user.role,
      userId: user._id,
      name: user.name,
      profilePhoto: user.profilePhoto || null,
      premiumMember: premium.premiumMember,
      premiumExpiry: premium.premiumExpiry
    });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      message: 'Login failed. Please try again later.'
    });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Session invalid' });
    }

    const premium = getPremiumState(user);

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
        premiumMember: premium.premiumMember,
        premiumExpiry: premium.premiumExpiry
      }
    });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(401).json({ message: 'Invalid session' });
  }
};
