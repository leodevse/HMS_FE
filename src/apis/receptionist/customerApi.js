import axiosInstance from '../axiosConfig';

const normalizeUser = (user) => ({
    ...user,
    email: user.email || user.username,
    isActive: user.active ?? user.isActive,
    identityNumber: user.identityCard || user.identityNumber,
});

export const customerApi = {
    /**
     * Search customer by identity card, username, email, or phone number.
     * @param {string} keyword
     * @returns {Promise<Object|null>}
     */
    searchCustomer: async (keyword) => {
        const kw = String(keyword || '').trim().toLowerCase();
        if (!kw) return null;

        const response = await axiosInstance.get('/auth/users', {params: {role: 'CUSTOMER', size: 500}});
        const users = response.data?.content || [];
        const digitsOnly = kw.replace(/\D/g, '');

        const found = users.find((item) => {
            const username = String(item.username || '').toLowerCase();
            const email = String(item.email || '').toLowerCase();
            const identityCard = String(item.identityCard || '').toLowerCase();
            const phone = String(item.phoneNumber || '').replace(/\D/g, '');
            const phoneLast10 = phone.slice(-10);
            const kwLast10 = digitsOnly.slice(-10);

            return (
                username === kw ||
                email === kw ||
                identityCard === kw ||
                (digitsOnly && phone === digitsOnly) ||
                (phoneLast10 && kwLast10 && phoneLast10 === kwLast10)
            );
        });

        return found ? normalizeUser(found) : null;
    },

    /**
     * @deprecated use searchCustomer instead
     */
    getCustomerByIdentityCard: async (identityCard) => {
        return customerApi.searchCustomer(identityCard);
    },

    searchByPhone: async (phone) => {
        return customerApi.searchCustomer(phone);
    },
};
