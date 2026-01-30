import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Restaurant from '../models/Restaurant';

export const register = async (req: Request, res: Response) => {
  try {
    console.log('📝 Registration attempt:', { ...req.body, password: '***' });

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      console.log('❌ Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (role === 'admin') {
      console.log('❌ Admin registration blocked');
      return res.status(400).json({ message: 'Cannot register as admin' });
    }

    if (!['customer', 'owner'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role. Must be customer or owner' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      status: 'active'
    });

    console.log('✅ User registered successfully:', user._id);

    res.status(201).json({
      message: 'Registration successful! Please login.',
      userId: user._id,
      role: user.role
    });
  } catch (error: any) {
    console.error('❌ Registration error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }

    res.status(500).json({
      message: 'Account creation failed due to a server issue. Please try again later.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    email = email?.trim();
    console.log('🔐 [LOGIN DEBUG] Attempt for:', email);

    console.log('📦 [LOGIN DEBUG] Full Body:', JSON.stringify(req.body, null, 2));

    if (!email || !password) {
      console.log('❌ [LOGIN DEBUG] Missing email or password. Received:', { email, passwordReceived: !!password });
      return res.status(400).json({ message: 'Email and password required (Backend validated)' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ [LOGIN DEBUG] User NOT FOUND in DB for email:', email);
      return res.status(400).json({ message: `User not found: ${email}` });
    }

    console.log('👤 [LOGIN DEBUG] User found:', { id: user._id, role: user.role, status: user.status });

    if (user.status === 'blocked') {
      console.log('❌ [LOGIN DEBUG] Account blocked:', email);
      return res.status(403).json({ message: 'You are blocked by the TOMATO team' });
    }

    if (user.role === 'owner') {
      try {
        const restaurant = await Restaurant.findOne({ ownerId: user._id });
        console.log('🏠 [LOGIN DEBUG] Restaurant check:', restaurant ? 'Found' : 'Not Found');
        if (restaurant && restaurant.isRemoved) {
          console.log('❌ [LOGIN DEBUG] Restaurant removed/blocked for owner:', email);
          return res.status(403).json({ message: 'You are blocked by the TOMATO team' });
        }
      } catch (err) {
        console.log('⚠️ [LOGIN DEBUG] Restaurant check failed/errored:', err);
      }
    }

    console.log('🔑 [LOGIN DEBUG] Comparing passwords...');
    // Log length of passwords to check for whitespace issues without revealing secrets
    console.log(`🔑 [LOGIN DEBUG] Input URL length: ${password.length}, Stored Hash length: ${user.password.length}`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('📊 [LOGIN DEBUG] Password match result:', isMatch);

    if (!isMatch) {
      console.log('❌ [LOGIN DEBUG] Password mismatch for:', email);
      // Temporarily explicit for debugging
      return res.status(400).json({ message: 'Password incorrect (Verify casing/spaces)' });
    }

    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
    console.log('🛡️ [LOGIN DEBUG] Signing token with secret length:', secret.length);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    console.log('✅ [LOGIN DEBUG] SUCCESS:', user.email);

    res.json({
      token,
      role: user.role,
      userId: user._id,
      name: user.name
    });
  } catch (error: any) {
    console.error('💥 [LOGIN DEBUG] CRITICAL ERROR:', error);
    res.status(500).json({
      message: 'Login failed due to a server issue. Please try again later.',
      error: error.message
    });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    // The middleware 'protect' will attach the user to req.user
    // If we reach here, the token is valid.
    // We just return the user info to confirm session is active.

    // We need to cast req as any or extend the type, typically protect middleware adds user.
    // Assuming standard middleware pattern:
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'User not found or session invalid' });
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        premiumMember: user.premiumMember
      }
    });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(401).json({ message: 'Invalid session' });
  }
};
