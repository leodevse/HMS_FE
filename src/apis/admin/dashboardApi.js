import axiosInstance from '../axiosConfig';
import { roomApi } from './roomApi';
import { reservationApi } from './reservationApi';

export const dashboardApi = {
    getDashboardData: async () => {
        // There is no single aggregate admin dashboard endpoint in the current backend.
        // We combine available endpoints to build the dashboard numbers.
        const [statsResponse, rooms, adminResponse, receptionistResponse, housekeepingResponse, customerResponse, reservationResponse, recentReservationPage] = await Promise.all([
            axiosInstance.get('/bookings/reservations/stats'),
            roomApi.getRooms({ page: 0, size: 200 }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'ADMIN' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'RECEPTIONIST' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, isActive: true, role: 'HOUSEKEEPING' } }),
            axiosInstance.get('/auth/users', { params: { page: 0, size: 1, role: 'CUSTOMER' } }),
            axiosInstance.get('/bookings/reservations', { params: { page: 0, size: 1 } }),
            reservationApi.getReservations({ page: 0, size: 5 }),
        ]);

        const reservationStats = statsResponse.data || {};
        const totalRooms = Array.isArray(rooms) ? rooms.length : 0;

        const normalizeRoomType = (name) => String(name || '').trim().toLowerCase();
        const formatRoomTypeLabel = (type) => {
            const normalized = String(type || '').trim().toLowerCase();
            if (!normalized) return 'Unknown Room';
            if (normalized.includes('deluxe')) return 'Deluxe Room';
            if (normalized.includes('family')) return 'Family Room';
            if (normalized.includes('standard')) return 'Standard Room';
            if (normalized.includes('suite')) return 'Suite Room';
            return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Room`;
        };

        const roomTypeCounts = rooms.reduce((counts, room) => {
            const rawName = room.roomClass?.className || room.roomClassName || room.roomType || room.type || '';
            const key = normalizeRoomType(rawName);
            if (!key) return counts;
            const label = formatRoomTypeLabel(key);
            counts[label] = (counts[label] || 0) + 1;
            return counts;
        }, {});

        const totalStaff = [adminResponse, receptionistResponse, housekeepingResponse].reduce((sum, response) => sum + Number(response.data?.totalElements ?? 0), 0);
        const currentGuests = Number(customerResponse.data?.totalElements ?? 0);
        const bookingsToday = Number(reservationResponse.data?.totalElements ?? 0);

        const recentBookings = Array.isArray(recentReservationPage.content)
            ? recentReservationPage.content.map((reservation) => ({
                ...reservation,
                reservationId: reservation.bookingId ?? reservation.id,
                customerName: reservation.customer?.fullName || reservation.customerName || reservation.guestName || reservation.bookingCode || 'Guest',
                bookingType: reservation.bookingType || reservation.type || 'Room',
                expectedCheckIn: reservation.checkInDate || reservation.expectedCheckIn || reservation.checkIn || reservation.createdAt,
                bookedAt: reservation.bookedAt || reservation.createdAt || reservation.createDate || reservation.createdAt,
                code: reservation.bookingCode || reservation.code || reservation.bookingId || reservation.id,
            }))
            : [];

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
                deluxeRooms: Number(reservationStats.DELUXE ?? roomTypeCounts['Deluxe Room'] ?? 0),
                familyRooms: Number(reservationStats.FAMILY ?? roomTypeCounts['Family Room'] ?? 0),
                standardRooms: Number(reservationStats.STANDARD ?? roomTypeCounts['Standard Room'] ?? 0),
                roomTypeCounts,
            },
            recentBookings,
        };
    },
};
