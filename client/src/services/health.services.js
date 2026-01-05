import axios from '@/api/axios';

export const getSystemStatus = async () => {
    try {
        const res = await axios.get('/health');
        return res.data;
    } catch (error) {
        if (error.response) {
            return error.response.data; // Return degraded status structure if available
        }
        throw error;
    }
};
