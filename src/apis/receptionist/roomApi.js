import axiosInstance from "../axiosConfig.js";

const normalizeRoom = (room = {}) => ({
	...room,
	roomClassId: room.roomClassId ?? room.roomClass?.id,
	roomClassName: room.roomClassName ?? room.roomClass?.className ?? room.roomClass?.name ?? "",
	roomClass: room.roomClass ? {
		...room.roomClass,
		name: room.roomClass.name ?? room.roomClass.className,
	} : null,
	// The current room schema has no soft-delete/active field. A returned room is active.
	isActive: room.isActive ?? room.active ?? true,
});

export const roomApi = {
	/**
	 *
	 * @param {RoomSearchParams} roomSearchParams
	 * @returns {Promise<PageResponse<RoomResponse>>}
	 */
	getRooms: async (roomSearchParams = {}) => {
		const requestedPage = Math.max(Number(roomSearchParams.page) || 0, 0);
		const requestedSize = Math.max(Number(roomSearchParams.size) || 10, 1);
		const roomNumber = String(roomSearchParams.roomNumber || "").trim().toLowerCase();

		const {data} = await axiosInstance.get(
				"/catalog/rooms",
				{
					params: {
						status: roomSearchParams.status || undefined,
						roomClassId: roomSearchParams.roomClassId || undefined,
						page: 0,
						size: 500,
						sort: "roomNumber,asc",
					}
				}
		);

		const rooms = (Array.isArray(data) ? data : data?.content || [])
				.map(normalizeRoom)
				.filter((room) => !roomNumber || String(room.roomNumber || "").toLowerCase().includes(roomNumber));
		const start = requestedPage * requestedSize;

		return {
			content: rooms.slice(start, start + requestedSize),
			totalElements: rooms.length,
			totalPages: Math.ceil(rooms.length / requestedSize),
			number: requestedPage,
			size: requestedSize,
		};
	},

	getRoomById: async (id) => {
		const {data} = await axiosInstance.get(`/catalog/rooms/${id}`);
		return normalizeRoom(data);
	},

	getOccupiedRooms: async (searchParams = {}) => {
		const requestedPage = Math.max(Number(searchParams.page) || 0, 0);
		const requestedSize = Math.max(Number(searchParams.size) || 10, 1);
		const roomPage = await roomApi.getRooms({
			roomNumber: searchParams.roomNumber,
			roomClassId: searchParams.roomClassId,
			status: "OCCUPIED",
			page: 0,
			size: 500,
		});
		const {data: reservationPage} = await axiosInstance.get("/bookings/reservations", {
			params: {status: "IN_HOUSE", page: 0, size: 500},
		});
		const reservations = Array.isArray(reservationPage) ? reservationPage : reservationPage?.content || [];
		const stays = await Promise.all(reservations.map(async (reservation) => {
			const {data} = await axiosInstance.get("/bookings/reservation-rooms", {
				params: {reservationId: reservation.id},
			});
			return (Array.isArray(data) ? data : data?.content || []).map((assignment) => ({
				roomId: assignment.roomId,
				reservationRoomId: assignment.id,
				reservationId: reservation.id,
				bookingCode: reservation.bookingCode,
				guestFullName: reservation.customer?.fullName || `Customer #${reservation.customerId}`,
				guestPhoneNumber: reservation.customer?.phoneNumber || "",
				checkInDate: assignment.checkInDate || reservation.checkInDate,
				checkOutDate: assignment.checkOutDate || reservation.checkOutDate,
			}));
		}));
		const stayByRoomId = new Map(stays.flat().map((stay) => [Number(stay.roomId), stay]));
		const occupiedRooms = roomPage.content.map((room) => ({
			...room,
			...(stayByRoomId.get(Number(room.id)) || {}),
		}));
		const start = requestedPage * requestedSize;
		return {
			content: occupiedRooms.slice(start, start + requestedSize),
			totalElements: occupiedRooms.length,
			totalPages: Math.ceil(occupiedRooms.length / requestedSize),
			number: requestedPage,
			size: requestedSize,
		};
	},

	getRoomOccupants: async (reservationRoomId) => {
		if (!reservationRoomId) return [];
		const {data} = await axiosInstance.get('/bookings/room-occupants', {
			params: {reservationRoomId},
		});
		return Array.isArray(data) ? data : [];
	},

	/**
	 * Get available physical rooms for manual assignment during check-in
	 */
	getAvailableRoomsForAssignment: async (roomClassId, checkInTime, checkOutTime) => {
		const {data} = await axiosInstance.get(`/bookings/availability`, {
			params: {
				roomClassId,
				checkInDate: checkInTime,
				checkOutDate: checkOutTime,
			}
		});
		return Array.isArray(data) ? data : (data.content || data.availableRooms || []);
	}
}
