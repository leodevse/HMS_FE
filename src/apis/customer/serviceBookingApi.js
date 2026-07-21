import axiosInstance from '../axiosConfig';

const asArray = (payload) => (Array.isArray(payload) ? payload : (payload?.content || []));

const ACTIVE_STATUSES = ['IN_HOUSE', 'PENDING'];

async function fetchRoomLabel(roomId) {
    if (!roomId) {
        return { roomNumber: `Room #${roomId || '?'}`, roomClassName: 'Unknown' };
    }
    try {
        const { data } = await axiosInstance.get(`/catalog/rooms/${roomId}`, {
            suppressErrorNotification: true,
        });
        return {
            roomNumber: data.roomNumber || `#${roomId}`,
            roomClassName: data.roomClass?.className || data.roomClassName || 'Room',
        };
    } catch {
        return { roomNumber: `#${roomId}`, roomClassName: 'Room' };
    }
}

/**
 * Rooms the customer can charge services to:
 * - IN_HOUSE stays (already checked in)
 * - PENDING bookings that already have assigned rooms
 */
export const getActiveAllocations = async (customerId) => {
    if (!customerId) return [];

    const allocations = [];
    for (const status of ACTIVE_STATUSES) {
        const { data: page } = await axiosInstance.get('/bookings/reservations', {
            params: { customerId, status, page: 0, size: 100 },
            suppressErrorNotification: true,
        });

        for (const reservation of asArray(page)) {
            const { data: roomsPayload } = await axiosInstance.get('/bookings/reservation-rooms', {
                params: { reservationId: reservation.id },
                suppressErrorNotification: true,
            });

            for (const assignment of asArray(roomsPayload)) {
                if (!assignment.roomId) continue;
                const room = await fetchRoomLabel(assignment.roomId);
                allocations.push({
                    allocationId: assignment.id,
                    reservationId: reservation.id,
                    bookingStatus: reservation.bookingStatus || status,
                    roomId: assignment.roomId,
                    roomNumber: room.roomNumber,
                    roomClassName: room.roomClassName,
                });
            }
        }
    }

    // Deduplicate by allocation id
    const seen = new Set();
    return allocations.filter((item) => {
        if (seen.has(item.allocationId)) return false;
        seen.add(item.allocationId);
        return true;
    });
};

async function ensureFolio(reservationId) {
    try {
        const { data } = await axiosInstance.get(`/billing/checkout/${reservationId}`, {
            suppressErrorNotification: true,
        });
        if (data?.folioId) return data.folioId;
    } catch {
        // Folio may not exist yet for PENDING stays — create one below.
    }

    try {
        const { data } = await axiosInstance.post('/billing/folios', { reservationId });
        return data.id;
    } catch (error) {
        // Race / already exists: reopen checkout summary.
        if (error.response?.status === 409) {
            const { data } = await axiosInstance.get(`/billing/checkout/${reservationId}`);
            return data.folioId;
        }
        throw error;
    }
}

/**
 * Charge purchased services onto the reservation folio linked to each room allocation.
 */
export const createServiceBookings = async (payload) => {
    const items = payload?.items || [];
    if (!items.length) {
        throw new Error('No service items to book');
    }

    // Resolve allocationId -> reservationId (caller may omit reservationId)
    const allocationMeta = new Map();
    if (payload.customerId) {
        const active = await getActiveAllocations(payload.customerId);
        active.forEach((alloc) => allocationMeta.set(Number(alloc.allocationId), alloc));
    }

    const results = [];
    for (const item of items) {
        const meta = allocationMeta.get(Number(item.allocationId));
        const reservationId = meta?.reservationId || item.reservationId;
        if (!reservationId) {
            throw new Error(`Cannot resolve reservation for room allocation ${item.allocationId}`);
        }

        const folioId = await ensureFolio(reservationId);
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.price) || 0;
        const amount = unitPrice * quantity;

        const { data } = await axiosInstance.post('/billing/folio-items', {
            folioId,
            itemType: 'SERVICE',
            amount,
        });
        results.push(data);
    }

    return results;
>>>>>>> c48f05b6cc2b204acd48e9d40bbcb5960c6e42da
};
const asArray = (payload) => (Array.isArray(payload) ? payload : (payload?.content || []));

const ACTIVE_STATUSES = ['IN_HOUSE', 'PENDING'];

async function fetchRoomLabel(roomId) {
    if (!roomId) {
        return { roomNumber: `Room #${roomId || '?'}`, roomClassName: 'Unknown' };
    }
    try {
        const { data } = await axiosInstance.get(`/catalog/rooms/${roomId}`, {
            suppressErrorNotification: true,
        });
        return {
            roomNumber: data.roomNumber || `#${roomId}`,
            roomClassName: data.roomClass?.className || data.roomClassName || 'Room',
        };
    } catch {
        return { roomNumber: `#${roomId}`, roomClassName: 'Room' };
    }
}

/**
 * Rooms the customer can charge services to:
 * - IN_HOUSE stays (already checked in)
 * - PENDING bookings that already have assigned rooms
 */
export const getActiveAllocations = async (customerId) => {
    if (!customerId) return [];

    const allocations = [];
    for (const status of ACTIVE_STATUSES) {
        const { data: page } = await axiosInstance.get('/bookings/reservations', {
            params: { customerId, status, page: 0, size: 100 },
            suppressErrorNotification: true,
        });

        for (const reservation of asArray(page)) {
            const { data: roomsPayload } = await axiosInstance.get('/bookings/reservation-rooms', {
                params: { reservationId: reservation.id },
                suppressErrorNotification: true,
            });

            for (const assignment of asArray(roomsPayload)) {
                if (!assignment.roomId) continue;
                const room = await fetchRoomLabel(assignment.roomId);
                allocations.push({
                    allocationId: assignment.id,
                    reservationId: reservation.id,
                    bookingStatus: reservation.bookingStatus || status,
                    roomId: assignment.roomId,
                    roomNumber: room.roomNumber,
                    roomClassName: room.roomClassName,
                });
            }
        }
    }

    // Deduplicate by allocation id
    const seen = new Set();
    return allocations.filter((item) => {
        if (seen.has(item.allocationId)) return false;
        seen.add(item.allocationId);
        return true;
    });
};

async function ensureFolio(reservationId) {
    try {
        const { data } = await axiosInstance.get(`/billing/checkout/${reservationId}`, {
            suppressErrorNotification: true,
        });
        if (data?.folioId) return data.folioId;
    } catch {
        // Folio may not exist yet for PENDING stays — create one below.
    }

    try {
        const { data } = await axiosInstance.post('/billing/folios', { reservationId });
        return data.id;
    } catch (error) {
        // Race / already exists: reopen checkout summary.
        if (error.response?.status === 409) {
            const { data } = await axiosInstance.get(`/billing/checkout/${reservationId}`);
            return data.folioId;
        }
        throw error;
    }
}

/**
 * Charge purchased services onto the reservation folio linked to each room allocation.
 */
export const createServiceBookings = async (payload) => {
    const items = payload?.items || [];
    if (!items.length) {
        throw new Error('No service items to book');
    }

    // Resolve allocationId -> reservationId (caller may omit reservationId)
    const allocationMeta = new Map();
    if (payload.customerId) {
        const active = await getActiveAllocations(payload.customerId);
        active.forEach((alloc) => allocationMeta.set(Number(alloc.allocationId), alloc));
    }

    const results = [];
    for (const item of items) {
        const meta = allocationMeta.get(Number(item.allocationId));
        const reservationId = meta?.reservationId || item.reservationId;
        if (!reservationId) {
            throw new Error(`Cannot resolve reservation for room allocation ${item.allocationId}`);
        }

        const folioId = await ensureFolio(reservationId);
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.price) || 0;
        const amount = unitPrice * quantity;

        const { data } = await axiosInstance.post('/billing/folio-items', {
            folioId,
            itemType: 'SERVICE',
            amount,
        });
        results.push(data);
    }

    return results;
>>>>>>> c48f05b6cc2b204acd48e9d40bbcb5960c6e42da
};
