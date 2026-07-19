// src/apis/customerApi.js
import axiosInstance from './axiosConfig';

const daysBetween = (from, to) => from && to
    ? Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000)) : 0;

const normalizeBooking = async (reservation = {}) => {
    const assignments = Array.isArray(reservation.roomAssignments) ? reservation.roomAssignments : [];
    const rooms = await Promise.all(assignments.map(async assignment => {
        try {
            const {data} = await axiosInstance.get(`/catalog/rooms/${assignment.roomId}`, {suppressErrorNotification: true});
            return {...data, assignment};
        } catch {
            return {id: assignment.roomId, roomNumber: `#${assignment.roomId}`, assignment};
        }
    }));
    const checkIn = reservation.checkInDate || assignments[0]?.checkInDate;
    const checkOut = reservation.checkOutDate || assignments[0]?.checkOutDate;
    const nights = daysBetween(checkIn, checkOut);
    const totalPrice = rooms.reduce((sum, room) => sum + Number(room.roomClass?.basePrice || 0) * nights, 0);
    return {
        ...reservation,
        code: reservation.bookingCode,
        status: reservation.bookingStatus,
        checkIn,
        checkOut,
        nights,
        adults: reservation.numberOfMembers || assignments.reduce((sum, item) => sum + Number(item.guestCount || 0), 0),
        children: 0,
        roomType: [...new Set(rooms.map(room => room.roomClass?.className).filter(Boolean))].join(', ') || 'N/A',
        roomNumber: rooms.map(room => room.roomNumber).filter(Boolean).join(', '),
        rooms,
        totalPrice,
        hasReviewed: false,
        createdAt: checkIn,
    };
};

export const customerApi = {
    // Bookings
    getBookingHistory: async () => {
        const currentUser = JSON.parse(localStorage.getItem('authUser') || 'null');
        const response = await axiosInstance.get('/bookings/reservations', {
            params: currentUser?.id ? { customerId: currentUser.id } : undefined,
        });
        const content = Array.isArray(response.data?.content) ? response.data.content : [];
        return {...response, data: {...response.data, content: await Promise.all(content.map(normalizeBooking))}};
    },

    getBookingDetails: async (bookingId) => {
        const response = await axiosInstance.get(`/bookings/reservations/${bookingId}`);
        return {...response, data: await normalizeBooking(response.data)};
    },

    cancelBooking: async (bookingId) => {
        return axiosInstance.patch(`/bookings/reservations/${bookingId}/cancel`);
    },

    checkBookingReviewed: async (bookingId) => {
        const response = await axiosInstance.get('/reviews', { params: { reservationId: bookingId } });
        return response.data;
    },

    // Submit review
    submitReview: async (data) => {
        return axiosInstance.post('/reviews', data);
    },

    // Get my reviews
    getMyReviews: async () => {
        const response = await axiosInstance.get('/reviews', { params: { size: 100 } });
        return response.data;
    },

    updateReview: async (reviewId, data) => {
        return axiosInstance.put(`/reviews/${reviewId}`, data);
    },

    deleteReview: async (reviewId) => {
        return axiosInstance.delete(`/reviews/${reviewId}`);
    }
};
