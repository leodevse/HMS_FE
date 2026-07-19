import axiosInstance from './axiosConfig';

export const authApi = {
    login: async (username, password) => {
        const response = await axiosInstance.post('/auth/login', { username, password });
        return response.data;
    },

    // Register new user (customer)
    register: async (userData) => {
        const response = await axiosInstance.post('/auth/register', userData);
        return response.data;
    },


    // Forgot password
    forgotPassword: async (email) => {
        const response = await axiosInstance.post('/auth/forgot-password', { email });
        return response.data;
    },

};
