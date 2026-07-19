import axiosInstance from './axiosConfig';

export const userApi = {
    getCurrentUser: async () => {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
    },

    updateProfile: async (userData) => {
        const currentUser = JSON.parse(localStorage.getItem('authUser') || 'null');
        const response = await axiosInstance.put(`/auth/users/${currentUser.id}`, userData);
        return response.data;
    },

    changePassword: async (oldPassword, newPassword) => {
        const response = await axiosInstance.put('/auth/me/password', {
            oldPassword,
            newPassword,
        });
        return response.data;
    },
};
