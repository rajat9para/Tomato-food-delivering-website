import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testFlow = async () => {
    const timestamp = Date.now();
    const testUser = {
        name: 'Test User',
        email: `test${timestamp}@example.com`,
        password: 'password123',
        role: 'customer'
    };

    console.log('🚀 Starting end-to-end auth test...');

    try {
        // 1. Register
        console.log(`📝 Attempting registration for ${testUser.email}...`);
        const regRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
        console.log('✅ Registration SUCCESS:', regRes.status, regRes.data.message);

        // 2. Login
        console.log('🔐 Attempting login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login SUCCESS:', loginRes.status);
        console.log('📦 Data received:', JSON.stringify(loginRes.data, null, 2));

        const { token } = loginRes.data;
        if (!token) throw new Error('No token returned');

        // 3. Verify
        console.log('🛡️ Attempting verification...');
        const verifyRes = await axios.get(`${BASE_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Verification SUCCESS:', verifyRes.status, verifyRes.data.user.email);

        console.log('\n🎉 ALL AUTH TESTS PASSED!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ AUTH TEST FAILED!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
        process.exit(1);
    }
};

testFlow();
