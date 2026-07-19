import axiosInstance from '../axiosConfig';

const ROOMS_API_URL = '/catalog/rooms';
const ROOM_CLASSES_API_URL = '/catalog/room-classes';

const roomStatusLabelMap = {
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    CLEAN: 'Clean',
    DIRTY: 'Dirty',
    OCCUPIED: 'Occupied',
    MAINTENANCE: 'Maintenance',
};

const roomStatusValueMap = {
    Available: 'AVAILABLE',
    Reserved: 'RESERVED',
    Clean: 'CLEAN',
    Dirty: 'DIRTY',
    Occupied: 'OCCUPIED',
    Maintenance: 'MAINTENANCE',
};

function toUiRoom(item) {
    return {
        id: item.id,
        roomNumber: item.roomNumber,
        roomClassId: item.roomClass?.id,
        roomClassName: item.roomClass?.className,
        status: roomStatusLabelMap[item.status] || item.status,
        description: item.description || '',
        isActive: item.isActive,
    };
}

export const roomApi = {
    getRooms: async (params = {}) => {
        const response = await axiosInstance.get(ROOMS_API_URL, {
            params: {
                page: 0,
                size: 200,
                sort: 'id,desc',
                ...params,
            },
        });

        const content = Array.isArray(response.data)
            ? response.data
            : (Array.isArray(response.data?.content) ? response.data.content : []);
        return content.map(toUiRoom);
    },

    getRoomClasses: async () => {
        const response = await axiosInstance.get(ROOM_CLASSES_API_URL, {
            params: {
                page: 0,
                size: 200,
                sort: 'id,desc',
            },
        });

        const content = Array.isArray(response.data)
            ? response.data
            : (Array.isArray(response.data?.content) ? response.data.content : []);
        return content.map((item) => ({
            value: String(item.id),
            label: item.className,
        }));
    },

    createRoom: async (data) => {
        const payload = {
            roomNumber: data.roomNumber,
            roomClassId: Number(data.roomClassId),
            status: roomStatusValueMap[data.status] || data.status,
            description: data.description || null,
        };

        const response = await axiosInstance.post(ROOMS_API_URL, payload);
        return toUiRoom(response.data);
    },

    updateRoom: async (id, data) => {
        const payload = {
            roomNumber: data.roomNumber,
            roomClassId: Number(data.roomClassId),
            status: roomStatusValueMap[data.status] || data.status,
            description: data.description || null,
        };

        const response = await axiosInstance.put(`${ROOMS_API_URL}/${id}`, payload);
        return toUiRoom(response.data);
    },

    deleteRoom: async (id) => {
        await axiosInstance.delete(`${ROOMS_API_URL}/${id}`);
    },
};
