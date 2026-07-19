import axiosInstance from '../axiosConfig';
import { attachStandardTime } from '../../utils/hotelStayPolicy';

const API_URL = '/bookings/reservations';

const normalizeReservation = (reservation = {}) => ({
    ...reservation,
    bookingId: reservation.bookingId ?? reservation.id,
    status: reservation.status ?? reservation.bookingStatus,
    customer: reservation.customer || (reservation.customerId ? {
        id: reservation.customerId,
        fullName: `Customer #${reservation.customerId}`,
    } : null),
    numberOfMembers: reservation.numberOfMembers ?? reservation.numberOfRooms,
    checkInDate: attachStandardTime(reservation.checkInDate, 'checkIn'),
    checkOutDate: attachStandardTime(reservation.checkOutDate, 'checkOut'),
});

export const reservationApi = {
    getReservations: async (params = {}) => {
        const supportedParams = {
            page: params.page ?? 0,
            size: params.size ?? 10,
            status: params.status || undefined,
            customerId: params.customerId || undefined,
        };
        const response = await axiosInstance.get(API_URL, {
            params: {
                ...supportedParams,
            },
        });

        const payload = response.data || {};
        return {
            content: Array.isArray(payload.content) ? payload.content.map(normalizeReservation) : [],
            totalPages: payload.totalPages || 1,
            totalElements: payload.totalElements || 0,
            number: payload.number || 0,
        };
    },

    cancelReservation: async (reservationId) => {
        const response = await axiosInstance.patch(`${API_URL}/${reservationId}/cancel`);
        return response.data;
    },
};
