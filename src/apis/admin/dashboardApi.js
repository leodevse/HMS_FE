import axiosInstance from '../axiosConfig';

export const dashboardApi = {
    getDashboardData: async () => {
        // There is no aggregate admin dashboard endpoint in the current backend.
        // Reservation stats is the aggregate endpoint currently available through the gateway.
        const statsResponse = await axiosInstance.get('/bookings/reservations/stats');
        const reservationStats = statsResponse.data || {};

        return {
            stats: {
                totalRooms: 0,
                occupiedRooms: 0,
                dirtyRooms: 0,
                checkInsToday: 0,
                checkOutsToday: 0,
                totalGuests: 0,
                revenueToday: 0,
                pendingReservations: reservationStats.PENDING || 0,
            },
            recentBookings: [],
        };
    },
};
