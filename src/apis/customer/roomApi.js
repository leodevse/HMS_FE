import axiosInstance from '../axiosConfig';

export const searchRooms = async (params) =>
    (await axiosInstance.get('/catalog/rooms', { params })).data;

export const getRoomById = async (id) =>
    (await axiosInstance.get(`/catalog/rooms/${id}`)).data;

export const checkRoomNumberExists = async (roomNumber) => {
    const data = await searchRooms({ size: 200 });
    return (data.content || data).some((room) => room.roomNumber === roomNumber);
};

export const getAllRoomTypes = async () =>
    (await axiosInstance.get('/catalog/room-classes', { params: { size: 200 } })).data;

export const getSimilarRooms = async (roomId, limit = 4) => {
    const current = await getRoomById(roomId);
    const data = await searchRooms({ roomClassId: current.roomClass?.id, size: limit + 1 });
    return (data.content || data).filter((room) => String(room.id) !== String(roomId)).slice(0, limit);
};
