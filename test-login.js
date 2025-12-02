// Simple test script to check login
const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing backend connectivity...');
        
        // Test 1: Check if server is up
        const healthCheck = await axios.get('http://localhost:8080');
        console.log('✅ Server is responding:', healthCheck.data);
        
        // Test 2: Try login with test credentials
        console.log('\nTesting login...');
        const loginResponse = await axios.post('http://localhost:8080/login', {
            username: 'test',
            password: 'test'
        }, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful:', loginResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
    }
}

testLogin();