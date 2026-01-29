import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const inspectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI is not defined');
            process.exit(1);
        }

        console.log('🔗 Connecting to:', mongoUri);
        await mongoose.connect(mongoUri!);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({}).lean();

        console.log('📊 Total users in "User" model:', users.length);

        for (const user of users) {
            const u = user as any;
            console.log('----------------------------------------');
            console.log('ID:', u._id);
            console.log('Name:', u.name);
            console.log('Email:', u.email);
            console.log('Role:', u.role);
            console.log('Status:', u.status);
            console.log('Password Hash:', u.password);

            const testPass = u.email === 'admin@tomato.com' ? 'admin123' : '123456';
            const isMatch = bcrypt.compareSync(testPass, u.password);
            console.log(`🔑 Test password "${testPass}" match:`, isMatch);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during inspection:', error);
        process.exit(1);
    }
};

inspectDB();
