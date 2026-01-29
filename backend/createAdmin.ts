import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in the .env file');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      status: String,
      createdAt: Date
    }));

    const existingAdmin = await User.findOne({ email: 'admin@tomato.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email: admin@tomato.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      name: 'Admin',
      email: 'admin@tomato.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date()
    });

    console.log('========================================');
    console.log('✅ Admin created successfully!');
    console.log('========================================');
    console.log('📧 Email: admin@tomato.com');
    console.log('🔑 Password: admin123');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();
