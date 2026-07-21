import axiosInstance from '../axiosConfig';

const API_URL = '/billing/refunds';

export const refundApi = {
    getPendingRefunds: async (params) => {
        const response = await axiosInstance.get(`${API_URL}/pending`, { params });
        return response.data;
    },
    getRefundById: async (id) => {
        const response = await axiosInstance.get(`${API_URL}/${id}`);
        return response.data;
    },
    approveRefund: async (id) => {
        const response = await axiosInstance.post(`${API_URL}/${id}/approve`);
        return response.data;
    },
    rejectRefund: async (id, rejectReason) => {
        const response = await axiosInstance.post(`${API_URL}/${id}/reject`, { rejectReason });
        return response.data;
    }
};
