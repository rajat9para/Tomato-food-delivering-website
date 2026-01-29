import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixAndVerify = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri!);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@tomato.com';
        const password = 'admin123';

        // 1. Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ Admin not found, creating one...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name: 'Admin',
                email,
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Admin created');
        } else {
            console.log('👤 Admin found, updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();
            console.log('✅ Admin password updated');
        }

        // 2. Verify login logic
        const freshUser = await User.findOne({ email });
        console.log('🔑 Verification Step:');
        console.log('Email:', freshUser?.email);
        console.log('Hash in DB:', freshUser?.password);

        const isMatch = await bcrypt.compare(password, freshUser!.password);
        console.log('📊 bcrypt.compare result:', isMatch);

        if (isMatch) {
            console.log('🎉 SERVER-SIDE LOGIN LOGIC IS WORKING CORRECTLY.');
        } else {
            console.log('❌ SERVER-SIDE LOGIN LOGIC IS BROKEN.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixAndVerify();
