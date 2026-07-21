import axiosInstance from '../axiosConfig';

export const customerApi = {
    getCustomerByIdentityCard: async (identityCard) => {
        const response = await axiosInstance.get('/auth/users', { params: { role: 'CUSTOMER', size: 200 } });
        const user = (response.data?.content || []).find((item) =>
            String(item.identityCard || '').toLowerCase() === String(identityCard).trim().toLowerCase()
            || String(item.username || '').toLowerCase() === String(identityCard).trim().toLowerCase());
        return user ? { ...user, email: user.email || user.username, isActive: user.active } : null;
    },
};
