export const roomClassService = {
	/**
	 * Tìm hạng phòng theo ID từ danh sách hạng phòng có sẵn
	 *
	 * @param {RoomClassResponse[]} roomClasses - Danh sách hạng phòng có sẵn
	 * @param {number|string} id - ID của hạng phòng cần tìm
	 */
	findRoomClassById: (roomClasses, id) => {
		return roomClasses.find((roomClass) => roomClass.id === Number(id));
	},
};
