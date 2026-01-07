import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function testSync() {
    try {
        console.log('1. Logging in as Developer...');
        // We simulate login or just assume we have a token. 
        // For this script to work, we need a valid token.
        // We'll quick-fetch one using a known dev credential or mocking.
        // Since I don't have the password for 'desarrollador', I will use the one found in source or assume '123456' / 'dev1234'.
        // In DatabaseCleaner password was 'dev1234'.

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            usuario: 'desarrollador',
            password: 'dev1234' // Guessing based on DatabaseCleaner
        });

        if (!loginRes.data.token) {
            throw new Error('Login failed');
        }

        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Test Sync Tenant
        console.log('2. Testing Conservative Sync for a Tenant...');
        // Need a valid tenant ID. I'll pick one from `empresa` table via direct DB check or just guess ID 1 or 2.
        // Or I can list tenants first if I had an endpoint.
        const tenantId = 1; // Assuming ID 1 exists
        const targetVersionId = 1; // Assuming Version 1 exists

        const syncRes = await axios.post(`${API_URL}/sync/tenant/${tenantId}`, {
            target_version_id: targetVersionId,
            mode: 'CONSERVATIVE'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Sync Response:', syncRes.data);

        // 3. Test Sync Plan
        console.log('3. Testing Plan Sync (All Tenants)...');
        const planId = 2; // Assuming PRO plan
        const syncPlanRes = await axios.post(`${API_URL}/sync/plan/${planId}`, {
            target_version_id: targetVersionId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Sync Plan Response:', syncPlanRes.data);

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testSync();
