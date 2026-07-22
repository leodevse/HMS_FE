import axiosInstance from "../axiosConfig";
import {attachStandardTime} from '../../utils/hotelStayPolicy';
import {customerApi} from './customerApi';

const normalizeReservation = (reservation = {}) => ({
	...reservation,
	bookingId: reservation.bookingId ?? reservation.id,
	status: reservation.status ?? reservation.bookingStatus,
	customer: reservation.customer || { id: reservation.customerId, fullName: `Customer #${reservation.customerId}`, phoneNumber: '', identityCard: '' },
	numberOfMembers: reservation.numberOfMembers ?? reservation.numberOfRooms ?? 0,
	checkInDate: attachStandardTime(reservation.checkInDate, 'checkIn'),
	checkOutDate: attachStandardTime(reservation.checkOutDate, 'checkOut'),
	identityCard: reservation.identityCard || '',
});

const toDateOnly = (value) => String(value || '').slice(0, 10);

/**
 * Transform reservation detail to form data for edit mode
 * @param {Object} reservation - Full reservation object from getReservationById
 * @returns {Object} - ReservationRequest format
 */
export const transformReservationForEdit = (reservation) => {
	if (!reservation) return null;

	const customer = reservation.customer || {};
	const allocations = reservation.allocations || [];
	const totalMembers = reservation.numberOfMembers || 0;

	// Estimate adults/childs split (default 1 adult if unknown)
	const adults = totalMembers > 0 ? Math.max(1, Math.min(3, totalMembers)) : 1;
	const childs = Math.max(0, totalMembers - adults);

	// Transform allocations to roomClassQuantities format
	const roomClassQuantities = allocations.map((allocation, idx) => ({
		_key: Date.now() + idx,
		roomClassId: String(allocation.roomClassId || ''),
		numberOfPeople: allocation.numberOfPeople || 1,
		allocationId: allocation.id, // Keep allocation ID for update
	}));

	return {
		id: reservation.id,
		bookingCode: reservation.bookingCode,
		status: reservation.status,
		checkInDate: reservation.checkInDate,
		checkOutDate: reservation.checkOutDate,
		adults,
		childs,
		numberOfMembers: totalMembers,
		customerRequest: {
			customerId: customer.id || reservation.customerId,
			fullName: customer.fullName || '',
			phoneNumber: customer.phoneNumber || '',
			email: customer.email || customer.username || '',
			identityNumber: reservation.identityCard || customer.identityCard || '',
		},
		roomClassQuantities,
		note: reservation.note || '',
	};
};

/**
 * Update reservation (only PENDING status)
 */
const updateReservation = async (reservationId, updateData) => {
	const {data} = await axiosInstance.patch(
		`/bookings/reservations/${reservationId}/status`,
		{bookingStatus: 'PENDING'}, // Ensure still PENDING
	);
	return data;
};

/**
 * Delete old allocation and create new one
 */
const updateReservationRooms = async (reservationId, newRoomClassQuantities, dates) => {
	// Get current allocations
	const {data: currentAllocations} = await axiosInstance.get('/bookings/reservation-rooms', {
		params: {reservationId},
	});

	// Delete all old allocations
	for (const allocation of (currentAllocations || [])) {
		await axiosInstance.delete(`/bookings/reservation-rooms/${allocation.id}`);
	}

	// Create new allocations
	for (const roomQty of newRoomClassQuantities.filter(r => r.roomClassId)) {
		// Get available room for this class
		const {data: available} = await axiosInstance.get('/bookings/availability', {
			params: {
				roomClassId: Number(roomQty.roomClassId),
				checkInDate: toDateOnly(dates.checkInDate),
				checkOutDate: toDateOnly(dates.checkOutDate),
			},
		});

		const rooms = Array.isArray(available) ? available : [];
		if (rooms.length > 0) {
			await axiosInstance.post('/bookings/reservation-rooms', {
				reservationId,
				roomId: rooms[0].id,
				checkInDate: toDateOnly(dates.checkInDate),
				checkOutDate: toDateOnly(dates.checkOutDate),
				guestCount: Number(roomQty.numberOfPeople),
			});
		}
	}
};

export const reservationApi = {
	/**
	 * Update reservation (only PENDING status)
	 * @param {number} reservationId
	 * @param {Object} formData - Form data from MakeReservation
	 */
	updateReservation: async (reservationId, formData) => {
		const totalMembers = (Number(formData.adults) || 0) + (Number(formData.childs) || 0);
		const selections = (formData.roomClassQuantities || []).filter(r => r.roomClassId);

		if (!selections.length) throw new Error('Please select at least one room class');

		// Update reservation rooms (delete old, create new)
		await updateReservationRooms(reservationId, selections, {
			checkInDate: formData.checkInDate,
			checkOutDate: formData.checkOutDate,
		});

		// Update identity card separately so the value persisted in MakeReservation is preserved on edit
		const identityCard = formData.customerRequest?.identityNumber || null;
		try {
			await axiosInstance.patch(`/bookings/reservations/${reservationId}/identity-card`, {
				identityCard,
			});
		} catch (err) {
			// Don't fail the whole edit if identity card update fails (e.g. status no longer PENDING)
			console.warn('Failed to update identity card on reservation:', err);
		}

		// Return updated reservation
		return reservationApi.getReservationById(reservationId);
	},
	/**
	 * Hàm lấy danh sách đặt phòng dựa trên các tham số tìm kiếm
	 *
	 * @param {ReservationSearchParams} searchParams - Các tham số tìm kiếm để lọc danh sách đặt phòng
	 * @return {Promise<PageResponse<ReservationResponse>>} - Một Promise trả về một đối tượng chứa danh sách đặt phòng và thông tin phân trang
	 */
	getReservations: async (searchParams) => {
		const {data} = await axiosInstance.get("/bookings/reservations", {
			suppressErrorNotification: true,
			params: {
				page: searchParams?.page ?? 0,
				size: searchParams?.size ?? 10,
				sort: searchParams?.sort || 'id,desc',
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
		const customer = reservationRequest.customerRequest || {};
		let customerId = customer.customerId;
		if (!customerId) {
			const lookupValues = [...new Set([
				customer.identityNumber,
				customer.phoneNumber,
				customer.email,
			].map((value) => String(value || '').trim()).filter(Boolean))];
			let existingCustomer = null;
			for (const lookupValue of lookupValues) {
				existingCustomer = await customerApi.searchCustomer(lookupValue);
				if (existingCustomer) break;
			}
			if (existingCustomer) {
				customerId = existingCustomer.id;
			} else {
				const newCustomer = await customerApi.createCustomer(customer);
				customerId = newCustomer.id;
			}
		}
		if (!customerId) throw new Error('Unable to resolve or create the customer profile');
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
		const {data: created} = await axiosInstance.post("/bookings/reservations", {
			bookingCode,
			customerId,
			identityCard: reservationRequest.customerRequest?.identityNumber || null,
		});
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
		const {data} = await axiosInstance.patch(
			`/bookings/reservations/${reservationId}/check-in`,
			checkInRequest,
		);
		return data;
	},

	registerRoomOccupant: async (occupant) => {
		const {data} = await axiosInstance.post('/bookings/room-occupants', occupant);
		return data;
	},
};
