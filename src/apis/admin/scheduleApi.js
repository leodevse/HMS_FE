import axiosInstance from '../axiosConfig';

const API_URL = '/auth/schedules';

export const scheduleApi = {
    getSchedules: async (startDate, endDate) => {
        const response = await axiosInstance.get(API_URL, { params: { startDate, endDate } });
        return Array.isArray(response.data) ? response.data : [];
    },
    createSchedule: async (data) => {
        const response = await axiosInstance.post(API_URL, {
            staffId: Number(data.staffId),
            shiftId: Number(data.shiftId),
            startDate: data.startDate,
            endDate: data.endDate,
        });
        return response.data;
    },
    deleteSchedule: async (id) => (await axiosInstance.delete(`${API_URL}/${id}`)).data,
};
