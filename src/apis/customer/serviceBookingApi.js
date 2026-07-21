import axiosInstance from '../axiosConfig';

const asArray = (payload) => Array.isArray(payload) ? payload : (payload?.content || []);

export const getActiveAllocations = async (customerId) => {
    const {data: reservationPage} = await axiosInstance.get('/bookings/reservations', {
        params: {customerId, status: 'IN_HOUSE', size: 100},
        suppressErrorNotification: true,
    });

    const reservations = asArray(reservationPage);
    const allocations = reservations.flatMap(reservation => reservation.roomAssignments || []);

    return Promise.all(allocations.map(async allocation => {
        const {data: room} = await axiosInstance.get(`/catalog/rooms/${allocation.roomId}`, {
            suppressErrorNotification: true,
        });
        return {
            allocationId: allocation.id,
            reservationId: allocation.reservationId,
            roomNumber: room.roomNumber,
            roomClassName: room.roomClass?.className || 'Room',
        };
    }));
};

export const createServiceBookings = async ({items}) => {
    const folioIds = new Map();

    for (const item of items) {
        const {data: allocation} = await axiosInstance.get(
            `/bookings/reservation-rooms/${item.allocationId}`,
            {suppressErrorNotification: true},
        );

        let folioId = folioIds.get(allocation.reservationId);
        if (!folioId) {
            const {data: checkout} = await axiosInstance.get(
                `/billing/checkout/${allocation.reservationId}`,
                {suppressErrorNotification: true},
            );
            folioId = checkout.folioId;
            folioIds.set(allocation.reservationId, folioId);
        }

        await axiosInstance.post('/billing/folio-items', {
            folioId,
            itemType: 'SERVICE',
            amount: Number(item.price) * Number(item.quantity),
        });
    }
};
