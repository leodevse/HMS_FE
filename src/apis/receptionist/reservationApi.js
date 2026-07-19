import axiosInstance from "../axiosConfig";
import {attachStandardTime} from '../../utils/hotelStayPolicy';

const normalizeReservation = (reservation = {}) => ({
	...reservation,
	bookingId: reservation.bookingId ?? reservation.id,
	status: reservation.status ?? reservation.bookingStatus,
	customer: reservation.customer || { id: reservation.customerId, fullName: `Customer #${reservation.customerId}`, phoneNumber: '', identityCard: '' },
	numberOfMembers: reservation.numberOfMembers ?? reservation.numberOfRooms ?? 0,
	checkInDate: attachStandardTime(reservation.checkInDate, 'checkIn'),
	checkOutDate: attachStandardTime(reservation.checkOutDate, 'checkOut'),
});

const toDateOnly = (value) => String(value || '').slice(0, 10);

export const reservationApi = {
	/**
	 * Hàm lấy danh sách đặt phòng dựa trên các tham số tìm kiếm
	 *
	 * @param {ReservationSearchParams} searchParams - Các tham số tìm kiếm để lọc danh sách đặt phòng
	 * @return {Promise<PageResponse<ReservationResponse>>} - Một Promise trả về một đối tượng chứa danh sách đặt phòng và thông tin phân trang
	 */
	getReservations: async (searchParams) => {
		const {data} = await axiosInstance.get("/bookings/reservations", {
			params: {
				page: searchParams?.page ?? 0,
				size: searchParams?.size ?? 10,
				status: ['PENDING', 'IN_HOUSE', 'CHECKED_OUT', 'CANCELLED'].includes(searchParams?.status)
					? searchParams.status : undefined,
			},
		});
		return {
			...data,
			content: (data?.content || []).map(normalizeReservation),
		};
	},

	/**
	 * Get reservation details by ID
	 */
	getReservationById: async (id) => {
		const [{data: reservation}, {data: assignmentData}] = await Promise.all([
			axiosInstance.get(`/bookings/reservations/${id}`),
			axiosInstance.get('/bookings/reservation-rooms', { params: { reservationId: id } }),
		]);
		const assignments = Array.isArray(assignmentData) ? assignmentData : [];
		const allocations = await Promise.all(assignments.map(async (assignment) => {
			const {data: room} = await axiosInstance.get(`/catalog/rooms/${assignment.roomId}`);
			return {
				id: assignment.id,
				roomId: assignment.roomId,
				roomNumber: room.roomNumber,
				roomClassId: room.roomClass?.id,
				numberOfPeople: assignment.guestCount ?? 1,
				checkInDate: assignment.checkInDate,
				checkOutDate: assignment.checkOutDate,
			};
		}));
		const normalized = normalizeReservation(reservation);
		return {
			...normalized,
			allocations,
			checkInDate: normalized.checkInDate || allocations[0]?.checkInDate,
			checkOutDate: normalized.checkOutDate || allocations[0]?.checkOutDate,
		};
	},

	getRoomOccupants: async (reservationRoomId) => {
		const {data} = await axiosInstance.get('/bookings/room-occupants', {
			params: {reservationRoomId},
		});
		return Array.isArray(data) ? data : [];
	},

	/**
	 * Hàm tạo một đặt phòng mới dựa trên yêu cầu đặt phòng
	 *
	 * @param {ReservationRequest} reservationRequest - Đối tượng chứa thông tin yêu cầu đặt phòng, bao gồm thông tin khách hàng, phòng đã chọn, ngày check-in/check-out, v.v.
	 * @return {Promise<ReservationResponse>} - Một Promise trả về đối tượng chứa thông tin chi tiết của đặt phòng vừa được tạo
	 */
	makeReservation: async (reservationRequest) => {
		const customerId = reservationRequest.customerRequest?.customerId;
		if (!customerId) throw new Error('Please search and select an existing customer first');
		const selections = (reservationRequest.roomClassQuantities || []).filter((item) => item.roomClassId);
		if (!selections.length) throw new Error('Please select at least one room class');
		if (selections.length !== (reservationRequest.roomClassQuantities || []).length) {
			throw new Error('Please select a room class for every allocation row');
		}

		const {data: roomClassPayload} = await axiosInstance.get('/catalog/room-classes');
		const roomClasses = Array.isArray(roomClassPayload) ? roomClassPayload : (roomClassPayload?.content || []);
		const assignedGuests = selections.reduce((sum, item) => sum + (Number(item.numberOfPeople) || 0), 0);
		if (assignedGuests !== Number(reservationRequest.numberOfMembers)) {
			throw new Error(`Assigned guests (${assignedGuests}) must equal total guests (${reservationRequest.numberOfMembers})`);
		}
		for (const selection of selections) {
			const roomClass = roomClasses.find((item) => Number(item.id) === Number(selection.roomClassId));
			if (!roomClass) throw new Error('A selected room class no longer exists');
			const maxCapacity = Number(roomClass.maxOccupancy ?? roomClass.maxCapacity ?? 0);
			if (Number(selection.numberOfPeople) > maxCapacity) {
				throw new Error(`${roomClass.className || roomClass.name} allows at most ${maxCapacity} guests per room`);
			}
		}

		const bookingCode = `RES-${Date.now()}`;
		const {data: created} = await axiosInstance.post("/bookings/reservations", { bookingCode, customerId });
		const reservationId = created.id ?? created.bookingId;
		const usedRoomIds = new Set();

		try {
			for (const selection of selections) {
				const {data: available} = await axiosInstance.get('/bookings/availability', {
					params: {
						roomClassId: Number(selection.roomClassId),
						checkInDate: toDateOnly(reservationRequest.checkInDate),
						checkOutDate: toDateOnly(reservationRequest.checkOutDate),
					},
				});
				const room = (Array.isArray(available) ? available : []).find((item) => !usedRoomIds.has(item.id));
				if (!room) throw new Error('A selected room class is no longer available');
				usedRoomIds.add(room.id);
				await axiosInstance.post('/bookings/reservation-rooms', {
					reservationId,
					roomId: room.id,
					checkInDate: toDateOnly(reservationRequest.checkInDate),
					checkOutDate: toDateOnly(reservationRequest.checkOutDate),
					guestCount: Number(selection.numberOfPeople),
				});
			}
			return normalizeReservation(created);
		} catch (error) {
			await axiosInstance.delete(`/bookings/reservations/${reservationId}`, { suppressErrorNotification: true }).catch(() => {});
			throw error;
		}
	},

	/**
	 * Perform check-in for a reservation
	 */
	checkInReservation: async (reservationId, checkInRequest) => {
		void checkInRequest;
		const {data} = await axiosInstance.patch(`/bookings/reservations/${reservationId}/check-in`);
		return data;
	},

	registerRoomOccupant: async (occupant) => {
		const {data} = await axiosInstance.post('/bookings/room-occupants', occupant);
		return data;
	},
};
