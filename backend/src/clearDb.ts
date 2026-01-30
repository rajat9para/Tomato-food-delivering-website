import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDb = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const collections = await mongoose.connection.db.collections();

        console.log('🧹 Clearing all collections...');
        for (const collection of collections) {
            await collection.deleteMany({});
            console.log(`   - Cleared: ${collection.collectionName}`);
        }

        console.log('✨ Database cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
};

clearDb();
