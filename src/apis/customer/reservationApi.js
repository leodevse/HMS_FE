import axiosInstance from '../axiosConfig';

export const createBooking = async (bookingData) => {
    const currentUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    const payload = {
        bookingCode: bookingData.bookingCode || `BK-${Date.now()}`,
        customerId: bookingData.customerId || currentUser?.id,
    };
    return (await axiosInstance.post('/bookings/reservations', payload)).data;
};
