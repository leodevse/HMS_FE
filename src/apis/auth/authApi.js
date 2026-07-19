import axiosInstance from '../axiosConfig';

export const authApi = {
    login: async (username, password) => {
        const response = await axiosInstance.post('/auth/login', { username, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await axiosInstance.post('/auth/register', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await axiosInstance.post('/auth/forgot-password', { email });
        return response.data;
    },

    getMyProfile: async () => {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
    }
};
