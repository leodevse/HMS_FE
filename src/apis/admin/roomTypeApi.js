import axiosInstance from '../axiosConfig';

const API_URL = '/catalog/room-classes';

function toUiRoomType(item) {
    return {
        id: item.id,
        name: item.className,
        standardOccupancy: Number(item.standardOccupancy || 1),
        maxOccupancy: Number(item.maxOccupancy || 2),
        extraPersonFee: Number(item.extraPersonFee || 0),
        baseRate: Number(item.basePrice || 0),
    };
}

function toApiPayload(data) {
    return {
        className: data.name,
        basePrice: Number(data.baseRate),
        standardOccupancy: Number(data.standardOccupancy),
        maxOccupancy: Number(data.maxOccupancy),
        extraPersonFee: Number(data.extraPersonFee || 0),
    };
}

export const roomTypeApi = {
    getRoomTypes: async (params = {}) => {
        const response = await axiosInstance.get(API_URL, {
            params: {
                page: 0,
                size: 200,
                ...params,
            },
        });

        const payload = response.data;
        const content = Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : []);
        return content.map(toUiRoomType);
    },

    createRoomType: async (data) => {
        const response = await axiosInstance.post(API_URL, toApiPayload(data));
        return toUiRoomType(response.data);
    },

    updateRoomType: async (id, data) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, toApiPayload(data));
        return toUiRoomType(response.data);
    },

    deleteRoomType: async (id) => {
        await axiosInstance.delete(`${API_URL}/${id}`);
    },
};
