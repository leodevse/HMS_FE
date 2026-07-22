import axiosInstance from '../axiosConfig';

export const dashboardApi = {
    getDashboardData: async () => {
        // There is no single aggregate admin dashboard endpoint in the current backend.
        // We combine available endpoints to build the dashboard numbers.
        const [statsResponse, roomsResponse, adminResponse, receptionistResponse, housekeepingResponse, customerResponse, reservationResponse] = await Promise.all([
            axiosInstance.get('/bookings/reservations/stats'),
            axiosInstance.get('/catalog/rooms', { params: { page: 0, size: 500 } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'ADMIN' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'RECEPTIONIST' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'HOUSEKEEPING' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, role: 'CUSTOMER' } }),
            axiosInstance.get('/bookings/reservations', { params: { page: 0, size: 1 } }),
        ]);

        const reservationStats = statsResponse.data || {};
        const roomPayload = roomsResponse.data;
        const roomList = Array.isArray(roomPayload)
            ? roomPayload
            : (Array.isArray(roomPayload?.content) ? roomPayload.content : []);

        const totalRooms = Number(roomPayload?.totalElements ?? roomList.length);
        const roomTypeCounts = roomList.reduce((counts, room) => {
            const roomType = room.roomClass?.className || room.roomClassName || room.roomClass?.name || 'Unknown';
            const normalizedType = String(roomType || 'Unknown').trim();
            counts[normalizedType] = (counts[normalizedType] || 0) + 1;
            return counts;
        }, {});

        const totalStaff = [adminResponse, receptionistResponse, housekeepingResponse].reduce((sum, response) => sum + Number(response.data?.totalElements ?? 0), 0);
        const currentGuests = Number(customerResponse.data?.totalElements ?? 0);
        const bookingsToday = Number(reservationResponse.data?.totalElements ?? 0);

        return {
            stats: {
                totalRooms,
                occupiedRooms: Number(reservationStats.OCCUPIED || 0),
                dirtyRooms: Number(reservationStats.DIRTY || 0),
                readyRooms: Number(reservationStats.READY || 0),
                bookedRooms: Number(reservationStats.BOOKED || 0),
                checkInsToday: Number(reservationStats.CHECKIN_TODAY || 0),
                checkOutsToday: Number(reservationStats.CHECKOUT_TODAY || 0),
                totalGuests: currentGuests,
                revenueToday: Number(reservationStats.REVENUE_TODAY || 0),
                pendingReservations: Number(reservationStats.PENDING || 0),
                totalStaff,
                currentGuests,
                bookingsToday,
                roomTypeCounts,
            },
            recentBookings: [],
        };
    },
};
