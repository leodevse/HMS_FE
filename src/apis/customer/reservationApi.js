import axiosInstance from '../axiosConfig';

const toDateOnly = (value) => new Date(value).toISOString().slice(0, 10);

export const createBooking = async (bookingData) => {
    const currentUser = JSON.parse(localStorage.getItem('authUser') || 'null');
    const payload = {
        bookingCode: bookingData.bookingCode || `BK-${Date.now()}`,
        customerId: bookingData.customer?.customerId || bookingData.customerId || currentUser?.id,
    };
    if (!payload.customerId) throw new Error('Please sign in before booking');

    const selectedClasses = (bookingData.rooms || []).filter(room => Number(room.quantity) > 0);
    if (!selectedClasses.length) throw new Error('Please select at least one room');
    const totalRooms = selectedClasses.reduce((sum, room) => sum + Number(room.quantity), 0);
    let remainingGuests = Number(bookingData.guests || 0);
    if (remainingGuests < totalRooms) throw new Error('At least one guest is required for each selected room');

    const {data: created} = await axiosInstance.post('/bookings/reservations', payload);
    const reservationId = created.id ?? created.bookingId;
    const usedRoomIds = new Set();
    let remainingRooms = totalRooms;

    try {
        for (const roomClass of selectedClasses) {
            const {data: availablePayload} = await axiosInstance.get('/bookings/availability', {
                params: {
                    roomClassId: Number(roomClass.id),
                    checkInDate: toDateOnly(bookingData.checkIn),
                    checkOutDate: toDateOnly(bookingData.checkOut),
                },
                suppressErrorNotification: true,
            });
            const availableRooms = (Array.isArray(availablePayload) ? availablePayload : [])
                .filter(room => !usedRoomIds.has(room.id));
            if (availableRooms.length < Number(roomClass.quantity)) {
                throw new Error(`${roomClass.name} no longer has enough rooms available`);
            }

            for (let index = 0; index < Number(roomClass.quantity); index += 1) {
                const room = availableRooms[index];
                usedRoomIds.add(room.id);
                const capacity = Number(roomClass.maxCapacity || roomClass.standardCapacity || 1);
                const guestsForRoom = Math.max(1, Math.min(capacity, remainingGuests - (remainingRooms - 1)));
                await axiosInstance.post('/bookings/reservation-rooms', {
                    reservationId,
                    roomId: room.id,
                    checkInDate: toDateOnly(bookingData.checkIn),
                    checkOutDate: toDateOnly(bookingData.checkOut),
                    guestCount: guestsForRoom,
                }, {suppressErrorNotification: true});
                remainingGuests -= guestsForRoom;
                remainingRooms -= 1;
            }
        }
        if (remainingGuests !== 0) throw new Error('Selected room capacities cannot accommodate all guests');
        return {
            ...created,
            reservationCode: created.bookingCode,
            depositAmount: selectedClasses.reduce((sum, room) => sum + Number(room.total || 0), 0) * 0.2,
        };
    } catch (error) {
        await axiosInstance.delete(`/bookings/reservations/${reservationId}`, {suppressErrorNotification: true}).catch(() => {});
        throw error;
    }
};
