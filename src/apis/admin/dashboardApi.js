import axiosInstance from '../axiosConfig';
import { reservationApi } from './reservationApi';

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
            // increase page size for customers to reliably count total when backend doesn't return totalElements
            // fetch customers only (original behavior)
            axiosInstance.get('/auth/users', { params: { page: 0, size: 5000, role: 'CUSTOMER' } }),
            // we will fetch recent reservations separately using reservationApi to get normalized data
        ]);

        // Debug: log raw responses to help diagnose mismatched counts
        try {
            // eslint-disable-next-line no-console
            console.debug('dashboardApi responses', {
                stats: statsResponse?.data,
                rooms: roomsResponse?.data,
                admin: adminResponse?.data,
                receptionist: receptionistResponse?.data,
                housekeeping: housekeepingResponse?.data,
                customer: customerResponse?.data,
            });
        } catch (e) {
            // ignore logging errors
        }

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

        const extractTotal = (response) => {
            if (!response) return 0;
            const data = response.data;
            if (data == null) return 0;
                if (typeof data.totalElements !== 'undefined') return Number(data.totalElements || 0);
                if (Array.isArray(data)) return data.length;
                if (Array.isArray(data.content)) return data.content.length;
                // Common nested array keys some backends use
                const nestedKeys = ['data', 'items', 'results', 'users', 'rows'];
                for (const key of nestedKeys) {
                    if (Array.isArray(data[key])) return data[key].length;
                }
                // If object has a paged structure under 'data' with content
                if (data.data && Array.isArray(data.data.content)) return data.data.content.length;
                return 0;
        };

        const totalStaff = [adminResponse, receptionistResponse, housekeepingResponse].reduce((sum, response) => sum + extractTotal(response), 0);

        // original behavior: use totalElements (or content length) from customerResponse
        const currentGuests = extractTotal(customerResponse);
        let bookingsToday = 0;

        // Fetch recent reservations (normalized) using reservationApi
        let recentBookings = [];
        try {
            const reservationPage = await reservationApi.getReservations({ page: 0, size: 5 });
            recentBookings = Array.isArray(reservationPage.content) ? reservationPage.content : [];
            bookingsToday = Number(reservationPage.totalElements ?? bookingsToday);
        } catch (err) {
            // ignore and keep recentBookings empty
        }

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
            recentBookings,
        };
    },
};
