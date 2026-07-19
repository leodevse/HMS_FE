import axiosInstance from '../axiosConfig';

const getRooms = async (params = {}) =>
    (await axiosInstance.get('/catalog/rooms', { params: { size: 200, ...params } })).data?.content || [];

export const housekeepingApi = {
    getFloors: async () => {
        const rooms = await getRooms();
        return [...new Set(rooms.map((room) => String(room.roomNumber).charAt(0)))].sort();
    },
    getRoomMatrix: async (floor) => (await getRooms()).filter((room) =>
        !floor || String(room.roomNumber).startsWith(String(floor))
    ),
    getAvailableStaff: async () =>
        ((await axiosInstance.get('/auth/users', { params: { role: 'HOUSEKEEPING', isActive: true, size: 200 } })).data?.content || [])
            .map((staff) => ({ ...staff, email: staff.username, role: staff.roleName, isActive: staff.active })),
    getAllTasks: async () => {
        const response = await axiosInstance.get('/catalog/housekeeping-tasks');
        return Array.isArray(response.data) ? response.data : [];
    },
    assignTask: async (data) => (await axiosInstance.post('/catalog/housekeeping-tasks', data)).data,
    deleteTask: async (id) => (await axiosInstance.delete(`/catalog/housekeeping-tasks/${id}`)).data,
};
