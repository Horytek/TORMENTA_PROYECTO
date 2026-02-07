import expressApi from './express.services';

export const getPlansRequest = async () => {
    try {
        const response = await expressApi.get('/subscription/plans');
        return response.data;
    } catch (error) {
        console.error("Error fetching plans:", error);
        throw error;
    }
};

export const getSubscriptionStatusRequest = async () => {
    try {
        const response = await expressApi.get('/subscription/status');
        return response.data;
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        throw error;
    }
};

export const subscribeToPlanRequest = async (plan_id) => {
    try {
        const response = await expressApi.post('/subscription/subscribe', { plan_id });
        return response.data;
    } catch (error) {
        console.error("Error connecting to subscription:", error);
        throw error;
    }
};
