import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { API_PORT, BASE_URL } from './config';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import ownerRoutes from './routes/ownerRoutes';
import customerRoutes from './routes/customerRoutes';
import path from 'path';
import fs from 'fs';

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method !== 'GET') {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to TOMATO Food Delivery API! 🍅 The server is running successfully.');
});

// Public endpoint for restaurant search (no auth required)
app.get('/api/public/restaurants', async (req, res) => {
  try {
    const Restaurant = (await import('./models/Restaurant')).default;
    const restaurants = await Restaurant.find({ approvalStatus: 'approved', activeStatus: true })
      .select('name cuisineType address imageUrl');
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public endpoint for dish search (no auth required)
app.get('/api/public/dishes', async (req, res) => {
  try {
    const FoodItem = (await import('./models/FoodItem')).default;
    const dishes = await FoodItem.find({ availability: true })
      .select('name price images category')
      .populate('restaurantId', 'name')
      .limit(50);
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/customer', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.path);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = API_PORT;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('✅ TOMATO Backend Server Started');
    console.log('========================================');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🌐 API: ${BASE_URL}`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'public/uploads')}`);
    console.log(`🗄️  Database: Connected`);
    console.log('========================================');
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
