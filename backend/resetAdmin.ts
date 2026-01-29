import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resetAdmin = async () => {
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

    // Delete existing admin
    const deleted = await User.deleteOne({ email: 'admin@tomato.com' });
    if (deleted.deletedCount > 0) {
      console.log('🗑️  Deleted existing admin account');
    }

    // Create fresh admin with correct password
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
    console.log('✅ Admin account reset successfully!');
    console.log('========================================');
    console.log('📧 Email: admin@tomato.com');
    console.log('🔑 Password: admin123');
    console.log('========================================');
    
    // Verify password works
    const admin = await User.findOne({ email: 'admin@tomato.com' });
    if (admin && admin.password) {
      const isValid = await bcrypt.compare('admin123', admin.password as string);
      console.log('✅ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();