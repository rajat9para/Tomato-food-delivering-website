const BASE_URL = 'http://localhost:5000/api';

const testFlow = async () => {
    const timestamp = Date.now();
    const testUser = {
        name: 'Test User Fetch',
        email: `testfetch${timestamp}@example.com`,
        password: 'password123',
        role: 'customer'
    };

    console.log('🚀 Starting end-to-end auth test (Fetch)...');

    try {
        // 1. Register
        console.log(`📝 Attempting registration for ${testUser.email}...`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        console.log('✅ Registration:', regRes.status, regData.message);

        if (!regRes.ok) throw new Error('Registration failed');

        // 2. Login
        console.log('🔐 Attempting login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();
        console.log('✅ Login:', loginRes.status);
        console.log('📦 Data received:', JSON.stringify(loginData, null, 2));

        const { token } = loginData;
        if (!token) throw new Error('No token returned');

        // 3. Verify
        console.log('🛡️ Attempting verification...');
        const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, { // Wait, server.ts has app.use('/api/auth', authRoutes)
            // Actually authRoutes has router.get('/verify', auth, verify)
            // So URL is BASE_URL + /auth/verify
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Wait, BASE_URL is already http://localhost:5000/api
        const verifyResCorrect = await fetch(`${BASE_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyData = await verifyResCorrect.json();
        console.log('✅ Verification:', verifyResCorrect.status, verifyData.user ? verifyData.user.email : 'FAILED');

        if (verifyResCorrect.ok) {
            console.log('\n🎉 ALL AUTH TESTS PASSED!');
        } else {
            console.log('\n❌ VERIFICATION FAILED!');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ AUTH TEST FAILED!');
        console.error('Error:', err.message);
        process.exit(1);
    }
};

testFlow();
