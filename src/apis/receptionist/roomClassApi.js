import axiosInstance from "../axiosConfig";

const normalizeRoomClass = (roomClass = {}) => ({
	...roomClass,
	name: roomClass.name || roomClass.className || '',
	standardCapacity: roomClass.standardCapacity ?? roomClass.standardOccupancy ?? 1,
	maxCapacity: roomClass.maxCapacity ?? roomClass.maxOccupancy ?? 1,
	extraPersonFee: Number(roomClass.extraPersonFee || 0),
	basePrice: Number(roomClass.basePrice || 0),
});

const toDateOnly = (value) => String(value || '').slice(0, 10);

export const roomClassApi = {
	/**
	 * Hàm lấy hạng phòng và số phòng còn trống dựa trên ngày check-in và check-out
	 *
	 * @param {string} checkInDate - Ngày check-in (định dạng YYYY-MM-DD)
	 * @param {string} checkOutDate - Ngày check-out (định dạng YYYY-MM-DD)
	 * @param {number|null} excludeReservationId - Reservation ID cần loại trừ (khi edit, để phòng đang edit không bị tính là booked)
	 * @return {Promise<RoomClassAvailabilityResponse[]>} - Một Promise trả về một mảng đối tượng chứa thông tin về hạng phòng và số phòng còn trống
	 */
	getAvailableRooms: async (checkInDate, checkOutDate, excludeReservationId = null) => {
		const [classesResponse, availabilityResponse] = await Promise.all([
			axiosInstance.get("/catalog/room-classes", { params: { size: 200 } }),
			axiosInstance.get("/bookings/availability", {
			params: {
				checkInDate: toDateOnly(checkInDate),
				checkOutDate: toDateOnly(checkOutDate),
				...(excludeReservationId && { excludeReservationId }),
			},
			}),
		]);
		const classesPayload = classesResponse.data;
		const classes = (Array.isArray(classesPayload) ? classesPayload : classesPayload?.content || []).map(normalizeRoomClass);
		const rooms = Array.isArray(availabilityResponse.data) ? availabilityResponse.data : [];
		return classes.map((roomClass) => ({
			roomClass,
			availableRooms: rooms.filter((room) => Number(room.roomClass?.id) === Number(roomClass.id)).length,
		}));
	},

	/**
	 * Hàm lấy tất cả hạng phòng (danh sách cho Select)
	 *
	 * @returns {Promise<RoomClassResponse[]>}
	 */
	getAll: async () => {
		const {data} = await axiosInstance.get("/catalog/room-classes", { params: { size: 200 } });
		const list = Array.isArray(data) ? data : (data?.content || []);
		return list.map(normalizeRoomClass);
	}
};
