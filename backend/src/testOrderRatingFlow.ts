import axios from 'axios';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:5000/api';
// Hardcode URI for test script to avoid path/dotenv issues
const MONGODB_URI = 'mongodb://localhost:27017/tomato';

// Define minimal Order schema for updating status
const orderSchema = new mongoose.Schema({
    orderStatus: String,
    rating: Number,
    review: String,
    ratingImages: [String]
});
const Order = mongoose.model('Order', orderSchema);

const testFlow = async () => {
    try {
        console.log('🚀 Starting Order & Rating Flow Test...');

        // 0. Connect to DB (for manual status update)
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        } catch (e) {
            console.error('❌ DB Connection failed:', e);
            process.exit(1);
        }

        const timestamp = Date.now();
        const testUser = {
            name: 'Test Customer',
            email: `customer${timestamp}@test.com`,
            password: 'password123',
            role: 'customer'
        };

        // 1. Register
        console.log(`\n📝 Registering user ${testUser.email}...`);
        try {
            await axios.post(`${BASE_URL}/auth/register`, testUser);
            console.log('✅ Registration successful');
        } catch (err: any) {
            console.warn('⚠️ Registration warning (user might exist):', err.message);
        }

        // 2. Login
        console.log('\n🔐 Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful, token received');

        // 3. Update Profile (required for ordering)
        console.log('\n👤 Updating Profile...');
        await axios.put(`${BASE_URL}/customer/profile`, {
            name: 'Test Customer',
            address: '123 Test St',
            phone: '1234567890'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile updated');

        // 4. Get Restaurants
        console.log('\n🍽️ Fetching restaurants...');
        const restRes = await axios.get(`${BASE_URL}/customer/restaurants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const restaurants = restRes.data;
        if (restaurants.length === 0) {
            throw new Error('No restaurants key found. Cannot test ordering.');
        }
        const restaurantId = restaurants[0]._id;
        console.log(`✅ Found ${restaurants.length} restaurants. Using: ${restaurants[0].name} (${restaurantId})`);

        // 5. Get Menu
        console.log(`\n📜 Fetching menu for ${restaurants[0].name}...`);
        const menuRes = await axios.get(`${BASE_URL}/customer/restaurants/${restaurantId}/menu`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const items = menuRes.data;
        if (items.length === 0) {
            throw new Error('Restaurant has no food items.');
        }
        const foodItem = items[0];
        console.log(`✅ Found item: ${foodItem.name} (${foodItem._id}) - Price: ${foodItem.price}`);

        // 6. Place Order
        console.log('\n🛍️ Placing Order...');
        const orderPayload = {
            restaurantId: restaurantId,
            items: [{
                foodId: foodItem._id,
                quantity: 1,
                price: foodItem.price
            }],
            totalAmount: foodItem.price,
            paymentMethod: 'COD',
            deliveryAddress: {
                name: 'Test Customer',
                phone: '1234567890',
                address: '123 Test St'
            }
        };

        const orderRes = await axios.post(`${BASE_URL}/customer/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const orderId = orderRes.data.orderId;
        console.log('✅ Order placed successfully! ID:', orderId);

        // 7. Verify Order in 'My Orders'
        console.log('\n📋 Verifying in "My Orders"...');
        const myOrdersRes = await axios.get(`${BASE_URL}/customer/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const myOrder = myOrdersRes.data.find((o: any) => o._id === orderId);
        if (!myOrder) throw new Error('Order not found in My Orders list');
        console.log('✅ Order found in list, Status:', myOrder.orderStatus);

        // 8. Update Status to Completed (using Mongoose)
        console.log('\n🔧 Manually updating order status to "completed"...');
        await Order.findByIdAndUpdate(orderId, { orderStatus: 'completed' });
        console.log('✅ Order status updated in DB');

        // 9. Rate Order
        console.log('\n⭐ Rating Order...');
        // Need to use FormData simulation or just ensure backend accepts fields
        // Backend uses multer, so it EXPECTS multipart/form-data.
        // Axios requires FormData from 'form-data' package in Node.js, or we can constructs headers manually.
        // Since we are mocking user environment, let's use 'form-data' package if available, or try to construct boundary.
        // Checking package.json... 'form-data' is NOT in backend dependencies (axios might treat object as JSON if not FormData).
        // Wait, axios in node doesn't automatically do multipart unless we use 'form-data' lib.
        // But invalid content-type might fail multer.
        // Let's try sending JSON first. If it fails, I'll need to figure out multipart.
        // Actually, multer will parse body fields only if content-type is multipart.
        // If I send JSON, req.body might be empty or multer might ignore it.
        // Let's try to pass it as simple fields if possible.
        // Wait, I can use the boundary trick. Or better - check if I can install `form-data` or just use what's available.
        // Node's `fetch` (v18+) has `FormData`. Typescript version is 5.3, likely Node environment handles it?
        // Let's try to rely on axios and just formatting it strictly.

        // BETTER APPROACH: Use `form-data` package if it was there. It's not.
        // I will write a small helper or just assume I can skip file upload and pass fields? 
        // Multer `array()` handles text fields too.
        // I will use `axios` with constructed headers.

        // Actually, let's just use `fetch` if available globally (Node 18+).
        // But to be safe, I'll use a boundary string construction for the body.

        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        let body = '';
        body += `--${boundary}\r\nContent-Disposition: form-data; name="orderId"\r\n\r\n${orderId}\r\n`;
        body += `--${boundary}\r\nContent-Disposition: form-data; name="rating"\r\n\r\n5\r\n`;
        body += `--${boundary}\r\nContent-Disposition: form-data; name="review"\r\n\r\nGreat food!\r\n`;
        body += `--${boundary}--\r\n`;

        try {
            const rateRes = await axios.post(`${BASE_URL}/customer/orders/rate`, body, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                }
            });
            console.log('✅ Rating submitted successfully:', rateRes.data);
        } catch (error: any) {
            console.log('❌ Rating failed with multipart hack. Error:', error.response?.data || error.message);
            // Verify if it's the "localhost" issue (it shouldn't be here since we hit 5000 directly).
            // If this works, then the issue IS the frontend configuration.
            throw error;
        }

        console.log('\n🎉 ALL TESTS PASSED!');
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ TEST FAILED:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

testFlow();
