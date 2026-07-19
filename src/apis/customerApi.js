// src/apis/customerApi.js
import axiosInstance from './axiosConfig';

export const customerApi = {
    // Bookings
    getBookingHistory: async () => {
        const currentUser = JSON.parse(localStorage.getItem('authUser') || 'null');
        return axiosInstance.get('/bookings/reservations', {
            params: currentUser?.id ? { customerId: currentUser.id } : undefined,
        });
    },

    getBookingDetails: async (bookingId) => {
        return axiosInstance.get(`/bookings/reservations/${bookingId}`);
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
