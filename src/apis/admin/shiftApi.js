import axiosInstance from '../axiosConfig';

export const shiftApi = {
    getAllShifts: async () => {
        const response = await axiosInstance.get('/auth/shifts');
        return Array.isArray(response.data) ? response.data : [];
    },
};
