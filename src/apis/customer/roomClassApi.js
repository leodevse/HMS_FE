import dayjs from 'dayjs';
import axiosInstance from '../axiosConfig';

const asArray = (payload) => Array.isArray(payload) ? payload : (payload?.content || []);

const toCustomerRoomClass = (item, totalRooms = 0) => ({
    ...item,
    name: item.className,
    standardCapacity: Number(item.standardOccupancy || 1),
    maxCapacity: Number(item.maxOccupancy || 2),
    extraPersonFee: Number(item.extraPersonFee || 0),
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    assets: Array.isArray(item.amenities)
        ? item.amenities.map((name, index) => ({ id: `${item.id}-${index}`, name }))
        : [],
    totalRooms,
});

const getAllRoomClasses = async () =>
    asArray((await axiosInstance.get('/catalog/room-classes')).data);

const getRooms = async (params = {}) =>
    asArray((await axiosInstance.get('/catalog/rooms', { params: { size: 500, ...params } })).data);

const countRoomsByClass = (rooms) => rooms.reduce((counts, room) => {
    const classId = String(room.roomClass?.id);
    counts.set(classId, (counts.get(classId) || 0) + 1);
    return counts;
}, new Map());

export const getRoomClassList = async (
    page = 0,
    size = 9,
    checkIn = null,
    checkOut = null,
    sortBy = null,
) => {
    const effectiveSize = Number(size) || 9;
    const roomClasses = await getAllRoomClasses();
    let availableRooms;

    if (checkIn && checkOut) {
        try {
            availableRooms = asArray((await axiosInstance.get('/bookings/availability', {
                params: {
                    checkInDate: dayjs(checkIn).format('YYYY-MM-DD'),
                    checkOutDate: dayjs(checkOut).format('YYYY-MM-DD'),
                },
                suppressErrorNotification: true,
            })).data);
        } catch {
            availableRooms = await getRooms({ status: 'AVAILABLE' });
        }
    } else {
        availableRooms = await getRooms({ status: 'AVAILABLE' });
    }

    const counts = countRoomsByClass(availableRooms);
    let result = roomClasses
        .map((item) => toCustomerRoomClass(item, counts.get(String(item.id)) || 0))
        .filter((item) => item.totalRooms > 0);

    if (sortBy === 'priceAsc' || sortBy === 'price_asc') {
        result.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === 'priceDesc' || sortBy === 'price_desc') {
        result.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    }

    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / effectiveSize);
    const start = page * effectiveSize;
    return {
        data: result.slice(start, start + effectiveSize),
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: effectiveSize,
    };
};

export const getRoomClassDetail = async (id) => {
    const [roomClassResponse, rooms] = await Promise.all([
        axiosInstance.get(`/catalog/room-classes/${id}`),
        getRooms({ roomClassId: id }),
    ]);
    return toCustomerRoomClass(roomClassResponse.data, rooms.length);
};

export const getOtherRoomClasses = async (id) => {
    const [roomClasses, rooms] = await Promise.all([getAllRoomClasses(), getRooms({ status: 'AVAILABLE' })]);
    const counts = countRoomsByClass(rooms);
    return roomClasses
        .filter((item) => String(item.id) !== String(id))
        .map((item) => toCustomerRoomClass(item, counts.get(String(item.id)) || 0))
        .filter((item) => item.totalRooms > 0);
};
