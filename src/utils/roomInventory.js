const STORAGE_KEY = 'hms.admin.rooms';
const UPDATE_EVENT = 'hms:rooms-updated';

export const defaultRooms = [
    { id: 1, roomNumber: 'Room #1', roomType: 'Deluxe', floor: 1, status: 'Available', rate: 40, beds: 1, bathrooms: 1 },
    { id: 2, roomNumber: 'Room #2', roomType: 'Deluxe', floor: 1, status: 'Occupied', rate: 30, beds: 1, bathrooms: 1 },
    { id: 3, roomNumber: 'Room #3', roomType: 'Deluxe', floor: 2, status: 'Cleaning', rate: 30, beds: 1, bathrooms: 1 },
    { id: 4, roomNumber: 'Room #4', roomType: 'Suite', floor: 2, status: 'Maintenance', rate: 20, beds: 2, bathrooms: 1 },
    { id: 5, roomNumber: 'Room #5', roomType: 'Standard', floor: 1, status: 'Available', rate: 30, beds: 1, bathrooms: 1 },
    { id: 6, roomNumber: 'Room #6', roomType: 'Suite', floor: 1, status: 'Available', rate: 50, beds: 2, bathrooms: 2 },
    { id: 7, roomNumber: 'Room #7', roomType: 'Family', floor: 2, status: 'Available', rate: 50, beds: 3, bathrooms: 2 },
];

function canUseStorage() {
    return typeof window !== 'undefined' && !!window.localStorage;
}

function notifyRoomsUpdated(rooms) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: rooms }));
    }
}

export function getRoomsFromStorage() {
    if (!canUseStorage()) {
        return defaultRooms;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRooms));
        return defaultRooms;
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRooms));
            return defaultRooms;
        }
        return parsed;
    } catch {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRooms));
        return defaultRooms;
    }
}

export function saveRoomsToStorage(rooms) {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    notifyRoomsUpdated(rooms);
}

export function subscribeRooms(listener) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const onStorage = (event) => {
        if (event.key === STORAGE_KEY) {
            listener(getRoomsFromStorage());
        }
    };

    const onRoomsUpdated = (event) => {
        if (Array.isArray(event.detail)) {
            listener(event.detail);
            return;
        }
        listener(getRoomsFromStorage());
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(UPDATE_EVENT, onRoomsUpdated);

    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(UPDATE_EVENT, onRoomsUpdated);
    };
}